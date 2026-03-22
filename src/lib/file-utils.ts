/**
 * Client-side file processing utilities for chat attachments.
 */

export interface Attachment {
  id: string;
  type: "image" | "document";
  name: string;
  mimeType: string;
  /** base64 data URI for images; extracted text for documents */
  data: string;
  /** Thumbnail data URI for preview (images only) */
  previewUrl?: string;
  /** Original file size in bytes */
  size: number;
}

// Max image dimension (longest side) before resizing
const MAX_IMAGE_DIM = 1024;
// JPEG quality for compressed images
const JPEG_QUALITY = 0.8;
// Max file size for text documents (2MB)
const MAX_DOC_SIZE = 2 * 1024 * 1024;
// Max PDF size (10MB)
const MAX_PDF_SIZE = 10 * 1024 * 1024;

// File types we can process
const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "json", "csv", "tsv",
  "js", "jsx", "ts", "tsx", "py", "rb", "go", "rs",
  "java", "c", "cpp", "h", "hpp", "cs", "swift",
  "html", "css", "scss", "less", "xml", "yaml", "yml",
  "toml", "ini", "cfg", "conf", "env", "sh", "bash",
  "sql", "graphql", "prisma", "proto",
  "log", "gitignore", "dockerignore", "editorconfig",
]);

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function isImageFile(file: File): boolean {
  return IMAGE_TYPES.has(file.type);
}

export function isTextFile(file: File): boolean {
  // Check by MIME type
  if (file.type.startsWith("text/")) return true;
  if (file.type === "application/json") return true;
  if (file.type === "application/xml") return true;
  // Check by extension
  return TEXT_EXTENSIONS.has(getExtension(file.name));
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || getExtension(file.name) === "pdf";
}

export function isSupportedFile(file: File): boolean {
  return isImageFile(file) || isTextFile(file) || isPdfFile(file);
}

/**
 * Resize and compress an image to a base64 data URI.
 * Returns a JPEG data URI capped at MAX_IMAGE_DIM px on the longest side.
 */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Only resize if larger than max
        if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
          if (width > height) {
            height = Math.round((height / width) * MAX_IMAGE_DIM);
            width = MAX_IMAGE_DIM;
          } else {
            width = Math.round((width / height) * MAX_IMAGE_DIM);
            height = MAX_IMAGE_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // SVGs and PNGs with transparency → keep as PNG; everything else → JPEG
        const isPngType = file.type === "image/png" || file.type === "image/svg+xml";
        const outputType = isPngType ? "image/png" : "image/jpeg";
        const quality = isPngType ? undefined : JPEG_QUALITY;

        resolve(canvas.toDataURL(outputType, quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Create a small thumbnail for preview display.
 */
function createThumbnail(dataUri: string, maxDim = 120): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => reject(new Error("Thumbnail failed"));
    img.src = dataUri;
  });
}

/**
 * Read a text-based document file and return its content as a string.
 */
function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_DOC_SIZE) {
      reject(new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 2MB for text documents.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// Approximate character limit for extracted text to avoid blowing up LLM context.
// ~60k chars ≈ ~15k tokens, leaving room for system prompt + conversation history.
const MAX_TEXT_CHARS = 60_000;

/**
 * Extract text content from a PDF file using pdf.js.
 * - Uses worker-free mode (disableWorker) to avoid bundler path issues in Next.js
 * - Caps extracted text to MAX_TEXT_CHARS to stay within LLM token limits
 * - Falls back gracefully for scanned/image-only PDFs
 */
async function readPdfFile(file: File): Promise<string> {
  if (file.size > MAX_PDF_SIZE) {
    throw new Error(`PDF too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`);
  }

  // Dynamic import — pdf.js is only loaded when a PDF is actually attached
  const pdfjsLib = await import("pdfjs-dist");

  // Point to the worker file copied into /public — avoids all bundler/path
  // resolution issues in Next.js (Webpack, Turbopack).
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  const totalPages = pdf.numPages;
  let totalChars = 0;
  let truncatedAt: number | null = null;

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    if (!pageText.trim()) continue;

    // Check if adding this page would exceed the character limit
    if (totalChars + pageText.length > MAX_TEXT_CHARS) {
      // Take what we can from this page
      const remaining = MAX_TEXT_CHARS - totalChars;
      if (remaining > 100) {
        pageTexts.push(`[Page ${i}]\n${pageText.trim().slice(0, remaining)}...`);
      }
      truncatedAt = i;
      break;
    }

    pageTexts.push(`[Page ${i}]\n${pageText.trim()}`);
    totalChars += pageText.length;
  }

  if (pageTexts.length === 0) {
    throw new Error(
      "Could not extract text from this PDF. It may be a scanned/image-only PDF. " +
      "Try attaching a screenshot of the relevant pages instead."
    );
  }

  let result = pageTexts.join("\n\n");
  if (truncatedAt !== null) {
    result += `\n\n[Truncated: showing pages 1–${truncatedAt} of ${totalPages}. Document was too long to include in full.]`;
  }

  return result;
}

/**
 * Process a File into an Attachment.
 */
export async function processFile(file: File): Promise<Attachment> {
  const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  if (isImageFile(file)) {
    const dataUri = await resizeImage(file);
    const previewUrl = await createThumbnail(dataUri);
    return {
      id,
      type: "image",
      name: file.name,
      mimeType: file.type || "image/jpeg",
      data: dataUri,
      previewUrl,
      size: file.size,
    };
  }

  if (isPdfFile(file)) {
    const text = await readPdfFile(file);
    return {
      id,
      type: "document",
      name: file.name,
      mimeType: "application/pdf",
      data: text,
      size: file.size,
    };
  }

  if (isTextFile(file)) {
    const text = await readTextFile(file);
    return {
      id,
      type: "document",
      name: file.name,
      mimeType: file.type || "text/plain",
      data: text,
      size: file.size,
    };
  }

  throw new Error(`Unsupported file type: ${file.type || file.name}`);
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

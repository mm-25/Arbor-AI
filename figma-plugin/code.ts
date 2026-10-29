// Arbor AI Import — Figma Plugin (main thread)
// Works in both Figma Design files and FigJam.
// - Figma Design: frames with auto-layout + vector arrow paths
// - FigJam: frames with auto-layout + native connectors

// ── Colour helpers ──────────────────────────────────────────────────────────

interface NodeColor {
  fill: RGB;
  badge: RGB;
}

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}

function lighten(c: RGB, amount: number): RGB {
  return {
    r: c.r + (1 - c.r) * amount,
    g: c.g + (1 - c.g) * amount,
    b: c.b + (1 - c.b) * amount,
  };
}

const TYPE_COLORS: Record<string, string> = {
  actor: "#3b82f6",
  process: "#22c55e",
  decision: "#f59e0b",
  outcome: "#8b5cf6",
  problem: "#ef4444",
};

function colorsForType(type: string): NodeColor {
  const hex = TYPE_COLORS[type] || "#6b7280";
  const base = hexToRgb(hex);
  return { fill: lighten(base, 0.85), badge: base };
}

// ── Geometry helpers (for Figma Design vector arrows) ───────────────────────

function getAnchorPoint(
  frame: FrameNode,
  toX: number,
  toY: number,
): { x: number; y: number; side: string } {
  const cx = frame.x + frame.width / 2;
  const cy = frame.y + frame.height / 2;
  const dx = toX - cx;
  const dy = toY - cy;
  const gap = 2;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) return { x: frame.x + frame.width + gap, y: cy, side: "right" };
    return { x: frame.x - gap, y: cy, side: "left" };
  }
  if (dy > 0) return { x: cx, y: frame.y + frame.height + gap, side: "bottom" };
  return { x: cx, y: frame.y - gap, side: "top" };
}

function getCurveControls(
  src: { x: number; y: number; side: string },
  tgt: { x: number; y: number; side: string },
) {
  const dist = Math.sqrt((tgt.x - src.x) ** 2 + (tgt.y - src.y) ** 2);
  const curve = Math.max(40, Math.min(dist * 0.4, 150));

  let cp1x = src.x,
    cp1y = src.y,
    cp2x = tgt.x,
    cp2y = tgt.y;
  if (src.side === "right") cp1x += curve;
  else if (src.side === "left") cp1x -= curve;
  else if (src.side === "bottom") cp1y += curve;
  else cp1y -= curve;

  if (tgt.side === "right") cp2x += curve;
  else if (tgt.side === "left") cp2x -= curve;
  else if (tgt.side === "bottom") cp2y += curve;
  else cp2y -= curve;

  return { cp1x, cp1y, cp2x, cp2y };
}

// ── JSON payload types ──────────────────────────────────────────────────────

interface MapNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  color?: string;
}

interface MapEdge {
  sourcePoint?: { x: number; y: number };
  targetPoint?: { x: number; y: number };
  source: string;
  target: string;
  label?: string;
}

interface MapPayload {
  appName: string;
  version: number;
  nodes: MapNode[];
  edges: MapEdge[];
}

// ── Plugin entry point ──────────────────────────────────────────────────────

figma.showUI(__html__, { width: 420, height: 520 });

figma.ui.onmessage = async (
  msg: { type: string; payload?: MapPayload } | undefined,
) => {
  if (!msg) return;
  if (msg.type === "cancel") {
    figma.closePlugin();
    return;
  }
  if (msg.type !== "import" || !msg.payload) return;

  const data = msg.payload;

  // Detect editor type to choose connector strategy
  const hasCreateConnector = typeof figma.createConnector === "function";

  try {
    // Load all Inter font styles needed by both editors.
    // FigJam connectors internally use "Inter Medium" for their text.
    await Promise.all([
      figma.loadFontAsync({ family: "Inter", style: "Bold" }),
      figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }),
      figma.loadFontAsync({ family: "Inter", style: "Medium" }),
      figma.loadFontAsync({ family: "Inter", style: "Regular" }),
    ]);

    const frameMap: Record<string, FrameNode> = {};
    const allCreated: SceneNode[] = [];

    // ── Create node frames (works in both Figma + FigJam) ──────────────

    for (const node of data.nodes) {
      const colors = colorsForType(node.type);

      const frame = figma.createFrame();
      frame.name = node.label;
      frame.layoutMode = "VERTICAL";
      frame.paddingTop = 16;
      frame.paddingBottom = 16;
      frame.paddingLeft = 20;
      frame.paddingRight = 20;
      frame.itemSpacing = 8;
      frame.cornerRadius = 12;
      frame.primaryAxisSizingMode = "AUTO";
      frame.counterAxisSizingMode = "AUTO";
      frame.fills = [{ type: "SOLID", color: colors.fill }];
      frame.strokes = [{ type: "SOLID", color: colors.badge, opacity: 0.3 }];
      frame.strokeWeight = 1.5;

      const label = figma.createText();
      label.characters = node.label;
      label.fontName = { family: "Inter", style: "Bold" };
      label.fontSize = 14;
      label.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];
      frame.appendChild(label);

      const badge = figma.createText();
      badge.characters = (node.type || "unknown").toUpperCase();
      badge.fontName = { family: "Inter", style: "Semi Bold" };
      badge.fontSize = 10;
      badge.fills = [{ type: "SOLID", color: colors.badge }];
      badge.letterSpacing = { value: 8, unit: "PERCENT" };
      frame.appendChild(badge);

      frame.x = node.x;
      frame.y = node.y;

      frameMap[node.id] = frame;
      allCreated.push(frame);
    }

    // ── Create edges ───────────────────────────────────────────────────────

    for (const edge of data.edges) {
      const srcFrame = frameMap[edge.source];
      const tgtFrame = frameMap[edge.target];
      if ((!srcFrame && !edge.sourcePoint) || (!tgtFrame && !edge.targetPoint))
        continue;
      const srcCenter = edge.sourcePoint ?? {
        x: srcFrame!.x + srcFrame!.width / 2,
        y: srcFrame!.y + srcFrame!.height / 2,
      };
      const tgtCenter = edge.targetPoint ?? {
        x: tgtFrame!.x + tgtFrame!.width / 2,
        y: tgtFrame!.y + tgtFrame!.height / 2,
      };

      if (hasCreateConnector) {
        // ── FigJam / unified editor: use native connectors ──────────
        const connector = figma.createConnector();
        connector.connectorStart = srcFrame
          ? { endpointNodeId: srcFrame.id, magnet: "AUTO" }
          : { position: srcCenter };
        connector.connectorEnd = tgtFrame
          ? { endpointNodeId: tgtFrame.id, magnet: "AUTO" }
          : { position: tgtCenter };
        connector.strokes = [{ type: "SOLID", color: hexToRgb("#94a3b8") }];
        connector.strokeWeight = 2;

        // Set arrowhead on target end
        try {
          connector.connectorEndStrokeCap = "ARROW_EQUILATERAL";
        } catch (_) {}

        allCreated.push(connector);

        // Connector text label (built into the connector node)
        if (edge.label) {
          try {
            connector.text.characters = edge.label;
            connector.text.fills = [
              { type: "SOLID", color: hexToRgb("#64748b") },
            ];
          } catch (_) {
            // If connector text API not available, place a separate label
            const midX = (srcCenter.x + tgtCenter.x) / 2;
            const midY = (srcCenter.y + tgtCenter.y) / 2;
            const edgeLabel = figma.createText();
            edgeLabel.characters = edge.label;
            edgeLabel.fontName = { family: "Inter", style: "Regular" };
            edgeLabel.fontSize = 11;
            edgeLabel.fills = [{ type: "SOLID", color: hexToRgb("#64748b") }];
            edgeLabel.x = midX + 8;
            edgeLabel.y = midY - 8;
            allCreated.push(edgeLabel);
          }
        }
      } else {
        // ── Figma Design: draw S-curve vector paths ─────────────────
        const tgtCx = tgtCenter.x;
        const tgtCy = tgtCenter.y;
        const srcCx = srcCenter.x;
        const srcCy = srcCenter.y;

        const srcAnchor = srcFrame
          ? getAnchorPoint(srcFrame, tgtCx, tgtCy)
          : { ...srcCenter, side: tgtCx >= srcCx ? "right" : "left" };
        const tgtAnchor = tgtFrame
          ? getAnchorPoint(tgtFrame, srcCx, srcCy)
          : { ...tgtCenter, side: tgtCx >= srcCx ? "left" : "right" };
        const { cp1x, cp1y, cp2x, cp2y } = getCurveControls(
          srcAnchor,
          tgtAnchor,
        );

        // Bounding box with padding for arrowhead
        const pad = 14;
        const minX = Math.min(srcAnchor.x, cp1x, cp2x, tgtAnchor.x) - pad;
        const minY = Math.min(srcAnchor.y, cp1y, cp2y, tgtAnchor.y) - pad;
        const maxX = Math.max(srcAnchor.x, cp1x, cp2x, tgtAnchor.x) + pad;
        const maxY = Math.max(srcAnchor.y, cp1y, cp2y, tgtAnchor.y) + pad;

        // Local coords
        const lsx = srcAnchor.x - minX,
          lsy = srcAnchor.y - minY;
        const lc1x = cp1x - minX,
          lc1y = cp1y - minY;
        const lc2x = cp2x - minX,
          lc2y = cp2y - minY;
        const ltx = tgtAnchor.x - minX,
          lty = tgtAnchor.y - minY;

        // Arrowhead triangle at target end
        const angle = Math.atan2(lty - lc2y, ltx - lc2x);
        const aSize = 8;
        const a1a = angle + Math.PI * 0.82;
        const a2a = angle - Math.PI * 0.82;
        const ax1 = ltx + Math.cos(a1a) * aSize;
        const ay1 = lty + Math.sin(a1a) * aSize;
        const ax2 = ltx + Math.cos(a2a) * aSize;
        const ay2 = lty + Math.sin(a2a) * aSize;

        const connector = figma.createVector();
        connector.name = `${srcFrame?.name ?? "Free start"} → ${tgtFrame?.name ?? "Free end"}`;
        connector.x = minX;
        connector.y = minY;
        connector.vectorPaths = [
          {
            windingRule: "NONE",
            data: `M ${lsx} ${lsy} C ${lc1x} ${lc1y} ${lc2x} ${lc2y} ${ltx} ${lty}`,
          },
          {
            windingRule: "NONZERO",
            data: `M ${ltx} ${lty} L ${ax1} ${ay1} L ${ax2} ${ay2} Z`,
          },
        ];
        connector.resize(maxX - minX || 1, maxY - minY || 1);
        const strokeColor = hexToRgb("#94a3b8");
        connector.strokes = [{ type: "SOLID", color: strokeColor }];
        connector.strokeWeight = 2;
        connector.fills = [{ type: "SOLID", color: strokeColor }];
        allCreated.push(connector);

        // Edge label
        if (edge.label) {
          const mt = 0.5;
          const midX =
            (1 - mt) ** 3 * srcAnchor.x +
            3 * (1 - mt) ** 2 * mt * cp1x +
            3 * (1 - mt) * mt ** 2 * cp2x +
            mt ** 3 * tgtAnchor.x;
          const midY =
            (1 - mt) ** 3 * srcAnchor.y +
            3 * (1 - mt) ** 2 * mt * cp1y +
            3 * (1 - mt) * mt ** 2 * cp2y +
            mt ** 3 * tgtAnchor.y;
          const edgeLabel = figma.createText();
          edgeLabel.characters = edge.label;
          edgeLabel.fontName = { family: "Inter", style: "Regular" };
          edgeLabel.fontSize = 11;
          edgeLabel.fills = [{ type: "SOLID", color: hexToRgb("#64748b") }];
          edgeLabel.x = midX + 8;
          edgeLabel.y = midY - 8;
          allCreated.push(edgeLabel);
        }
      }
    }

    // ── Group everything ────────────────────────────────────────────────────

    if (allCreated.length > 0) {
      const group = figma.group(allCreated, figma.currentPage);
      group.name = `Arbor AI — ${data.nodes.length} nodes`;
      figma.viewport.scrollAndZoomIntoView([group]);
    }

    const edgeCount = data.edges ? data.edges.length : 0;
    const mode = hasCreateConnector ? "native connectors" : "vector arrows";
    figma.notify(
      `Imported ${data.nodes.length} node(s) and ${edgeCount} edge(s) using ${mode}.`,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    figma.notify(`Import failed: ${message}`, { error: true });
  }
};

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({error: "GROQ_API_KEY is not configured for recorded voice input. Typed Claude chat remains available."}, {status: 503});
    const groq = new Groq({apiKey});
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      language: "en",
      response_format: "json",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    console.error("Transcription error:", err);

    const message =
      err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

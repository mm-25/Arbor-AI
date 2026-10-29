"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseSpeechToTextReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
  clearError: () => void;
}

export function useSpeechToText(): UseSpeechToTextReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mounted = useRef(true);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestRef.current?.abort();
      const recorder = mediaRecorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        recorder.ondataavailable = null;
        if (recorder.state !== "inactive") recorder.stop();
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) {stream.getTracks().forEach(track => track.stop()); return;}
      streamRef.current = stream;

      // Pick a supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        // Don't send empty recordings
        if (audioBlob.size < 1000) {
          setError("Recording was too short. Please try again.");
          return;
        }

        // Send to our API for transcription
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          const ext = mimeType.includes("webm") ? "webm" : "m4a";
          formData.append("audio", audioBlob, `recording.${ext}`);

          const controller = new AbortController();
          requestRef.current = controller;
          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Transcription failed (${response.status})`);
          }

          const data = await response.json();
          if (!mounted.current) return;
          if (data.text && data.text.trim()) {
            setTranscript(data.text.trim());
          } else {
            setError("No speech was detected. Please try again.");
          }
        } catch (err) {
          if (!mounted.current) return;
          setError(
            err instanceof Error ? err.message : "Transcription failed. Please try again."
          );
        } finally {
          if (mounted.current) setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // collect chunks every second
      setIsRecording(true);
    } catch (err) {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (!mounted.current) return;
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError(
            "Microphone access was denied. Please allow microphone permissions in your browser settings."
          );
        } else if (err.name === "NotFoundError") {
          setError("No microphone found. Please connect a microphone and try again.");
        } else {
          setError(`Microphone error: ${err.message}`);
        }
      } else {
        setError("Could not access microphone. Please try again.");
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
    clearError,
  };
}

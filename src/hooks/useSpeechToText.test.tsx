// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useSpeechToText } from "./useSpeechToText";

afterEach(() => vi.unstubAllGlobals());

it("releases the microphone when its map is unmounted", async () => {
  const stop = vi.fn();
  const stream = {getTracks: () => [{stop}]};
  vi.stubGlobal("navigator", {mediaDevices: {getUserMedia: async () => stream}});
  class Recorder {
    static isTypeSupported() {return true;}
    state = "inactive";
    onstop: (() => void) | null = null;
    start() {this.state = "recording";}
    stop() {this.state = "inactive"; this.onstop?.();}
  }
  vi.stubGlobal("MediaRecorder", Recorder);
  const hook = renderHook(() => useSpeechToText());
  await act(async () => hook.result.current.startRecording());
  expect(hook.result.current.isRecording).toBe(true);
  hook.unmount();
  expect(stop).toHaveBeenCalledOnce();
});

it("releases a stream if microphone permission resolves after leaving the map", async () => {
  const stop = vi.fn();
  let resolve!: (stream: unknown) => void;
  vi.stubGlobal("navigator", {mediaDevices: {getUserMedia: () => new Promise(r => {resolve = r;})}});
  const hook = renderHook(() => useSpeechToText());
  let starting!: Promise<void>;
  act(() => {starting = Promise.resolve(hook.result.current.startRecording());});
  hook.unmount();
  resolve({getTracks: () => [{stop}]});
  await starting;
  expect(stop).toHaveBeenCalledOnce();
});

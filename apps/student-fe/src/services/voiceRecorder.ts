/**
 * Records a short voice command in the page and transcribes it on our backend.
 *
 * Browsers' built-in speech recognition sends audio to the browser vendor's cloud and fails
 * with a "network" error on many networks and in Chromium builds without Google's speech key
 * (Brave, Opera, VS Code's browser...). Recording with MediaRecorder works everywhere; the
 * backend transcribes with Whisper.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const SILENCE_AFTER_SPEECH_MS = 1200;
const NO_SPEECH_TIMEOUT_MS = 5000;
const MAX_RECORDING_MS = 8000;
const SPEECH_LEVEL = 0.06; // RMS above this counts as speech

export type AutoStopReason = "silence" | "max-length" | "no-speech";

export interface RecordingHandle {
  /** Stops and returns the recording. */
  stop: () => Promise<Blob>;
  /** Stops and discards the recording. */
  cancel: () => void;
  /** Whether any speech-level sound was heard. */
  heardSpeech: () => boolean;
}

export class VoiceInputError extends Error {
  constructor(message: string, readonly code: "mic" | "network" | "unavailable" | "empty" | "bad-request") {
    super(message);
  }
}

export const canRecord = () =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

const pickMimeType = () =>
  ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"].find(
    (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
  ) || "";

export const micErrorMessage = (err: unknown): string => {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return `Browsers only allow the microphone on secure pages. Open the app at http://localhost:${location.port || "3000"} instead of ${location.host}.`;
  }
  const name = (err as { name?: string })?.name;
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Microphone access is blocked. Click the lock icon in the address bar, allow the microphone, then try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No microphone was found. Connect one, or type your command below.";
    case "NotReadableError":
    case "AbortError":
      return "Your microphone is being used by another app. Close it there, then try again.";
    default:
      return "The microphone couldn't start. Type your command below instead.";
  }
};

export async function startRecording(opts: {
  onLevel?: (level: number) => void;
  onAutoStop?: (reason: AutoStopReason) => void;
}): Promise<RecordingHandle> {
  if (!canRecord()) {
    throw new VoiceInputError(micErrorMessage(new Error("unsupported")), "mic");
  }
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (err) {
    throw new VoiceInputError(micErrorMessage(err), "mic");
  }

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  // Loudness monitor: drives the level ring and stops automatically after the speaker pauses.
  const AudioCtx: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;
  const analyser = audioCtx?.createAnalyser();
  if (audioCtx && analyser) {
    analyser.fftSize = 1024;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
  }
  const samples = new Float32Array(analyser?.fftSize || 0);
  const startedAt = performance.now();
  let lastSpeechAt = 0;
  let heard = false;
  let frame = 0;
  let finished = false;

  const release = () => {
    finished = true;
    cancelAnimationFrame(frame);
    stream.getTracks().forEach((t) => t.stop());
    audioCtx?.close().catch(() => {});
  };

  const tick = () => {
    if (finished) return;
    const now = performance.now();
    if (analyser) {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
      const rms = Math.sqrt(sum / samples.length);
      opts.onLevel?.(Math.min(1, rms / 0.25));
      if (rms > SPEECH_LEVEL) {
        heard = true;
        lastSpeechAt = now;
      }
    }
    const elapsed = now - startedAt;
    let reason: AutoStopReason | null = null;
    if (heard && now - lastSpeechAt > SILENCE_AFTER_SPEECH_MS) reason = "silence";
    else if (!heard && analyser && elapsed > NO_SPEECH_TIMEOUT_MS) reason = "no-speech";
    else if (elapsed > MAX_RECORDING_MS) reason = "max-length";
    if (reason) {
      opts.onAutoStop?.(reason);
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  recorder.start(250);
  frame = requestAnimationFrame(tick);

  return {
    heardSpeech: () => heard,
    cancel: () => {
      if (finished) return;
      recorder.onstop = null;
      if (recorder.state !== "inactive") recorder.stop();
      release();
    },
    stop: () =>
      new Promise<Blob>((resolve) => {
        if (recorder.state === "inactive") {
          release();
          resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" }));
          return;
        }
        recorder.onstop = () => {
          release();
          resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" }));
        };
        recorder.stop();
      }),
  };
}

export async function transcribeAudio(blob: Blob, signal?: AbortSignal): Promise<string> {
  const type = (blob.type || "audio/webm").split(";")[0];
  const ext = type.includes("ogg") ? "ogg" : type.includes("mp4") ? "mp4" : type.includes("wav") ? "wav" : "webm";
  const form = new FormData();
  form.append("audio", new Blob([blob], { type }), `speech.${ext}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/voice/transcribe/`, { method: "POST", body: form, signal });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new VoiceInputError("I couldn't reach the Eduvia server to understand your voice. Check that it's running, or type your command.", "network");
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 503) {
    throw new VoiceInputError(data.error || "Voice recognition isn't available right now. Type your command instead.", "unavailable");
  }
  if (!response.ok) {
    throw new VoiceInputError(data.error || "I couldn't understand that recording. Try again.", "bad-request");
  }
  const text = String(data.text || "").trim();
  if (!text) throw new VoiceInputError("I didn't catch any words. Try again, a little closer to the mic.", "empty");
  return text;
}

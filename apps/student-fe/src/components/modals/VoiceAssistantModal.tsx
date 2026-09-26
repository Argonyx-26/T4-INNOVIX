import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Sparkles, SendHorizontal, AlertCircle, Loader2 } from "lucide-react";
import { useThemeMode } from "../../context/ThemeModeContext";
import { useAuth } from "../../context/AuthContext";
import {
  COURSE_FILTER_EVENT,
  COURSE_FILTER_KEY,
  HELP_LINES,
  SAMPLE_COMMANDS,
  VOICE_HINT_EVENT,
  VOICE_HINT_KEY,
  parseVoiceCommand,
} from "../../services/voiceCommands";
import { RecordingHandle, VoiceInputError, canRecord, startRecording, transcribeAudio } from "../../services/voiceRecorder";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (hash: string) => void;
}

// Errors from the browser's built-in recognition, which is only the fallback path.
const BROWSER_SPEECH_ERRORS: Record<string, string> = {
  network: "Your browser's own speech service couldn't be reached either. Type your command below instead.",
  "not-allowed": "Microphone access was blocked. Allow it from the lock icon in the address bar, or type your command below.",
  "service-not-allowed": "This browser doesn't allow speech recognition here. Type your command below instead.",
  "no-speech": "I didn't hear anything. Tap the mic and try again, or type your command below.",
  "audio-capture": "No microphone was found. Connect one, or type your command below.",
  "language-not-supported": "Speech recognition isn't available for English on this browser. Type your command below instead.",
};

const INTRO = "Tap the mic and say a command, or type one below. Say \"help\" to see what I can do.";

const getRecognitionCtor = (): any =>
  typeof window === "undefined" ? null : (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { speak } = useThemeMode();
  const { role, switchRole } = useAuth();
  const currentRole: "student" | "teacher" = role === "teacher" ? "teacher" : "student";

  // idle -> listening (recording) -> transcribing (server) -> the command runs
  const [phase, setPhase] = useState<"idle" | "listening" | "transcribing">("idle");
  const isListening = phase === "listening";
  const [level, setLevel] = useState(0);
  // After the Eduvia server can't transcribe, the next tap tries the browser's built-in recognition.
  const [useBrowserSpeech, setUseBrowserSpeech] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [reply, setReply] = useState(INTRO);
  const [showHelp, setShowHelp] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingRef = useRef<RecordingHandle | null>(null);
  const uploadRef = useRef<AbortController | null>(null);
  const closeTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const micSupported = canRecord() || !!getRecognitionCtor();

  const stopAll = () => {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = rec.onerror = rec.onend = null;
      try {
        rec.abort();
      } catch {
        // already stopped
      }
    }
    recordingRef.current?.cancel();
    recordingRef.current = null;
    uploadRef.current?.abort();
    uploadRef.current = null;
    setLevel(0);
    setPhase("idle");
  };

  // Reset on open, clean up on close/unmount.
  useEffect(() => {
    if (isOpen) {
      setTranscript("");
      setTyped("");
      setShowHelp(false);
      setMicError(micSupported ? null : "This browser can't record from the microphone. Type your command below instead.");
      setReply(INTRO);
    }
    return () => {
      stopAll();
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const runCommand = useCallback(
    (text: string) => {
      const { reply: message, action } = parseVoiceCommand(text, currentRole);
      setReply(message);
      setShowHelp(action.type === "help");
      speak(message);

      const finish = (hash: string) => {
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => {
          onNavigate(hash);
          onClose();
        }, 900);
      };

      switch (action.type) {
        case "navigate":
          finish(action.hash);
          break;
        case "hint":
          try {
            sessionStorage.setItem(VOICE_HINT_KEY, "1");
          } catch {
            // storage unavailable: the event below still covers an open diagnostic page
          }
          window.dispatchEvent(new CustomEvent(VOICE_HINT_EVENT));
          finish("#diagnostic");
          break;
        case "filter":
          try {
            sessionStorage.setItem(COURSE_FILTER_KEY, JSON.stringify(action.request));
          } catch {
            // storage unavailable
          }
          window.dispatchEvent(new CustomEvent(COURSE_FILTER_EVENT, { detail: action.request }));
          finish("#courses");
          break;
        case "role":
          switchRole(action.role).catch(() => setReply("I couldn't switch views just now. Try again from Settings."));
          finish(action.role === "teacher" ? "#teacher" : "#student");
          break;
        default:
          break;
      }
    },
    [currentRole, onClose, onNavigate, speak, switchRole]
  );

  // Primary path: record in the page and transcribe on the Eduvia server.
  const finishRecording = async () => {
    const handle = recordingRef.current;
    recordingRef.current = null;
    if (!handle) return;
    setLevel(0);
    const heard = handle.heardSpeech();
    const blob = await handle.stop();
    if (!heard && blob.size < 2000) {
      setPhase("idle");
      setMicError("I didn't hear anything. Tap the mic and speak, or type your command below.");
      return;
    }
    setPhase("transcribing");
    const controller = new AbortController();
    uploadRef.current = controller;
    try {
      const text = await transcribeAudio(blob, controller.signal);
      if (controller.signal.aborted) return;
      setTranscript(text);
      setPhase("idle");
      runCommand(text);
    } catch (err) {
      if (controller.signal.aborted || (err as Error)?.name === "AbortError") return;
      setPhase("idle");
      const voiceErr = err instanceof VoiceInputError ? err : null;
      const canFallBack = (voiceErr?.code === "network" || voiceErr?.code === "unavailable") && !!getRecognitionCtor();
      if (canFallBack) setUseBrowserSpeech(true);
      setMicError(
        (voiceErr?.message || "I couldn't understand that recording. Try again.") +
          (canFallBack ? " Tap the mic to try your browser's speech recognition instead." : "")
      );
      inputRef.current?.focus();
    } finally {
      if (uploadRef.current === controller) uploadRef.current = null;
    }
  };

  const startServerListening = async () => {
    stopAll();
    setTranscript("");
    setMicError(null);
    setPhase("listening");
    try {
      recordingRef.current = await startRecording({
        onLevel: setLevel,
        onAutoStop: (reason) => {
          if (reason !== "no-speech") {
            finishRecording();
            return;
          }
          recordingRef.current?.cancel();
          recordingRef.current = null;
          setLevel(0);
          setPhase("idle");
          setMicError("I didn't hear anything. Check that the right microphone is selected, then try again or type below.");
        },
      });
    } catch (err) {
      setPhase("idle");
      setMicError(err instanceof Error ? err.message : "The microphone couldn't start. Type your command below instead.");
      inputRef.current?.focus();
    }
  };

  // Fallback path: the browser's built-in recognition (depends on the browser vendor's cloud).
  const startBrowserListening = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    stopAll();
    setTranscript("");
    setMicError(null);

    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    let finalText = "";
    let failed = false;

    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      setTranscript((finalText + interim).trim());
    };
    rec.onerror = (event: any) => {
      failed = true;
      if (event.error === "aborted") return;
      // The browser service is unusable too: go back to server recording next time.
      if (event.error === "network" || event.error === "service-not-allowed") setUseBrowserSpeech(false);
      setMicError(BROWSER_SPEECH_ERRORS[event.error] || `The microphone stopped (${event.error || "unknown error"}). Type your command below instead.`);
      inputRef.current?.focus();
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setPhase("idle");
      if (!failed && finalText.trim()) runCommand(finalText.trim());
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setPhase("listening");
    } catch {
      recognitionRef.current = null;
      setMicError("The microphone couldn't start. Type your command below instead.");
    }
  };

  const toggleListening = () => {
    if (phase === "transcribing") return;
    if (isListening) {
      if (recordingRef.current) finishRecording();
      else recognitionRef.current?.stop();
      return;
    }
    if (canRecord() && !useBrowserSpeech) startServerListening();
    else startBrowserListening();
  };

  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    const text = typed.trim();
    if (!text) return;
    setTranscript(text);
    setTyped("");
    runCommand(text);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-assistant-title"
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/10 overflow-hidden transform animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-soft text-brand">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="voice-assistant-title" className="font-display font-bold text-lg text-[#141414]">
                LearnLens Voice Assistant
              </h3>
              <p className="text-xs text-[#6B6B6B] adhd-hide">Voice or typed commands</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close voice assistant"
            className="p-2 rounded-xl text-slate-400 hover:text-[#141414] hover:bg-black/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-6 flex flex-col items-center justify-center text-center">
          <button
            onClick={toggleListening}
            disabled={!micSupported || phase === "transcribing"}
            className={`relative p-6 rounded-full transition-all duration-300 transform active:scale-95 disabled:cursor-not-allowed ${
              !micSupported ? "opacity-40" : ""
            } ${
              isListening ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-110" : "bg-brand text-white shadow-lg shadow-brand/30 hover:scale-105"
            }`}
            aria-label={isListening ? "Stop listening" : phase === "transcribing" ? "Transcribing" : "Start listening"}
          >
            {phase === "transcribing" ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : isListening ? (
              <Mic className="w-8 h-8" />
            ) : (
              <MicOff className="w-8 h-8" />
            )}
            {isListening && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border-4 border-rose-500/40 pointer-events-none transition-transform duration-75"
                style={{ transform: `scale(${1.1 + level * 0.6})` }}
              />
            )}
          </button>

          <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400" aria-live="polite">
            {!micSupported
              ? "Microphone unavailable"
              : phase === "transcribing"
              ? "Working out what you said..."
              : isListening
              ? "Listening... tap to stop"
              : "Tap to speak"}
          </div>

          {transcript && (
            <p data-testid="voice-transcript" className="mt-3 text-sm font-medium text-brand-ink bg-brand-soft px-4 py-2 rounded-xl">
              &ldquo;{transcript}&rdquo;
            </p>
          )}

          {micError && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-left text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl max-w-md">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{micError}</span>
            </p>
          )}

          <div
            data-testid="voice-reply"
            aria-live="polite"
            className="mt-4 text-sm text-[#141414] bg-fill p-4 rounded-2xl border border-black/5 leading-relaxed max-w-md w-full text-left"
          >
            <p>{reply}</p>
            {showHelp && (
              <ul className="mt-2 space-y-1 list-disc pl-5 text-xs text-[#4A4A4A]">
                {HELP_LINES.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <form onSubmit={submitTyped} className="flex items-center gap-2 mb-4">
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type a command, e.g. open library"
            aria-label="Type a command"
            className="flex-1 min-w-0 text-sm px-3 py-2.5 rounded-xl bg-fill border border-black/10 focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <button
            type="submit"
            aria-label="Run command"
            disabled={!typed.trim()}
            className="p-2.5 rounded-xl bg-brand text-white hover:bg-brand-strong disabled:opacity-40 transition"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-black/5">
          <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block mb-2">Sample commands</span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                onClick={() => {
                  setTranscript(cmd);
                  runCommand(cmd);
                }}
                className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-fill-2 hover:bg-brand-soft hover:text-brand-ink transition"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

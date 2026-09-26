import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Sparkles, SendHorizontal, AlertCircle } from "lucide-react";
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

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (hash: string) => void;
}

const MIC_ERRORS: Record<string, string> = {
  network:
    "Voice recognition needs an internet connection to your browser's speech service, and it couldn't be reached. Type your command below instead.",
  "not-allowed": "Microphone access was blocked. Allow it from the lock icon in the address bar, or type your command below.",
  "service-not-allowed": "This browser doesn't allow speech recognition here. Type your command below instead.",
  "no-speech": "I didn't hear anything. Tap the mic and try again, or type your command below.",
  "audio-capture": "No microphone was found. Connect one, or type your command below.",
  "language-not-supported": "Speech recognition isn't available for English on this browser. Type your command below instead.",
};

const getRecognitionCtor = (): any =>
  typeof window === "undefined" ? null : (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { speak } = useThemeMode();
  const { role, switchRole } = useAuth();
  const currentRole: "student" | "teacher" = role === "teacher" ? "teacher" : "student";

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [reply, setReply] = useState("Tap the mic and say a command, or type one below. Say \"help\" to see what I can do.");
  const [showHelp, setShowHelp] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const closeTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const micSupported = !!getRecognitionCtor();

  const stopRecognition = () => {
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
    setIsListening(false);
  };

  // Reset on open, clean up on close/unmount.
  useEffect(() => {
    if (isOpen) {
      setTranscript("");
      setTyped("");
      setShowHelp(false);
      setMicError(micSupported ? null : "Speech recognition isn't supported in this browser. Type your command below instead.");
      setReply("Tap the mic and say a command, or type one below. Say \"help\" to see what I can do.");
    }
    return () => {
      stopRecognition();
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

  const startListening = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    stopRecognition();
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
      setMicError(MIC_ERRORS[event.error] || `The microphone stopped (${event.error || "unknown error"}). Type your command below instead.`);
      inputRef.current?.focus();
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      if (!failed && finalText.trim()) runCommand(finalText.trim());
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setMicError("The microphone couldn't start. Type your command below instead.");
    }
  };

  const toggleListening = () => (isListening ? recognitionRef.current?.stop() : startListening());

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
            disabled={!micSupported}
            className={`relative p-6 rounded-full transition-all duration-300 transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              isListening ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-110" : "bg-brand text-white shadow-lg shadow-brand/30 hover:scale-105"
            }`}
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? <Mic className="w-8 h-8 animate-pulse" /> : <MicOff className="w-8 h-8" />}
            {isListening && <span className="absolute -inset-2 rounded-full border-2 border-rose-500/40 animate-ping pointer-events-none" />}
          </button>

          <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {!micSupported ? "Microphone unavailable" : isListening ? "Listening... speak your command" : "Tap to speak"}
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

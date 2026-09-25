import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, X, Sparkles, Command, ArrowRight } from "lucide-react";
import { useThemeMode } from "../../context/ThemeModeContext";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (hash: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { speak } = useThemeMode();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [assistantResponse, setAssistantResponse] = useState<string>(
    "I'm listening! Speak commands like 'go to diagnostic', 'show courses', 'adaptive pacing', or 'help'."
  );
  const recognitionRef = useRef<any>(null);

  // Esc key dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Setup Web Speech API SpeechRecognition
  useEffect(() => {
    if (typeof window !== "undefined" && isOpen) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
          if (event.results[current].isFinal) {
            handleVoiceCommand(text);
          }
        };

        recognition.onerror = (event: any) => {
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setAssistantResponse("Microphone access was denied. Please click the lock icon in your browser URL bar to allow microphone access.");
          } else if (event.error === 'no-speech') {
            setAssistantResponse("No speech was detected. Please check your microphone settings and try again.");
          } else {
            setAssistantResponse(`Microphone error (${event.error || 'unknown'}). Please try speaking again or click a sample command.`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        // Removed auto-start to prevent browser permission blocks.
        // Users must explicitly click the microphone to begin listening.
      } else {
        setAssistantResponse("Web Speech Recognition API is not supported in this browser environment. You can test sample commands below!");
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      try {
        recognitionRef.current.start();
      } catch {
        // ignore
      }
    }
  };

  const handleVoiceCommand = (cmd: string) => {
    const lower = cmd.toLowerCase().trim();

    if (lower.includes("diagnostic") || lower.includes("test") || lower.includes("quiz") || lower.includes("nav:diagnostic")) {
      const resp = "Navigating to LearnLens AI Diagnostic Loop.";
      setAssistantResponse(resp);
      speak(resp);
      setTimeout(() => {
        onNavigate("#diagnostic");
        onClose();
      }, 1000);
    } else if (lower.includes("library") || lower.includes("resource") || lower.includes("material") || lower.includes("nav:library")) {
      const resp = "Opening Vetted Educational Resource Library.";
      setAssistantResponse(resp);
      speak(resp);
      setTimeout(() => {
        onNavigate("#library");
        onClose();
      }, 1000);
    } else if (lower.includes("hint") || lower.includes("give me a hint") || lower.includes("stuck") || lower.includes("scaffold")) {
      const resp = "Opening AI Diagnostic scaffolded hints: Tier 1 Nudge, Tier 2 Formula Scaffold, and Tier 3 Structural Guidance are available.";
      setAssistantResponse(resp);
      speak(resp);
      setTimeout(() => {
        onNavigate("#diagnostic");
        onClose();
      }, 1000);
    } else if (lower.includes("course") || lower.includes("curriculum") || lower.includes("syllabus") || lower.includes("filter:")) {
      const resp = "Opening Curriculum Explorer and Courses.";
      setAssistantResponse(resp);
      speak(resp);
      setTimeout(() => {
        onNavigate("#courses");
        onClose();
      }, 1000);
    } else if (lower.includes("pacing") || lower.includes("speed") || lower.includes("nav:pacing") || lower.includes("simulator")) {
      const resp = "Launching Intelligent Adaptive Pacing & Laboratory Modules.";
      setAssistantResponse(resp);
      speak(resp);
      setTimeout(() => {
        onNavigate("#pacing");
        onClose();
      }, 1000);
    } else if (lower.includes("teacher") || lower.includes("cohort") || lower.includes("toggle:teacher") || lower.includes("heatmap") || lower.includes("rag")) {
      const resp = "Opening Teacher Cohort Intelligence & RAG Chatbot.";
      setAssistantResponse(resp);
      speak(resp);
      setTimeout(() => {
        onNavigate("#teacher");
        onClose();
      }, 1000);
    } else if (lower.includes("mentor") || lower.includes("instructor") || lower.includes("faculty")) {
      const resp = "Viewing Faculty and Subject-Matter Experts.";
      setAssistantResponse(resp);
      speak(resp);
      setTimeout(() => {
        onNavigate("#mentors");
        onClose();
      }, 1000);
    } else if (lower.includes("path") || lower.includes("journey") || lower.includes("stage")) {
      const resp = "Opening 5-Stage Learning Progression Path.";
      setAssistantResponse(resp);
      speak(resp);
      setTimeout(() => {
        onNavigate("#paths");
        onClose();
      }, 1000);
    } else if (lower.includes("help")) {
      const resp = "Voice commands available: 'diagnostic', 'give me a hint', 'library', 'curriculum', 'adaptive pacing', 'learning paths', 'teacher cohort', and 'mentors'.";
      setAssistantResponse(resp);
      speak(resp);
    } else {
      const resp = `Heard: "${cmd}". Try saying 'go to diagnostic' or click one of the quick command buttons below.`;
      setAssistantResponse(resp);
      speak(resp);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden transform animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-[#8266F0]/15 text-[#8266F0]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#141414] dark:text-white">
                LearnLens Voice Assistant
              </h3>
              <p className="text-xs text-[#6B6B6B] dark:text-slate-400">
                Web Speech API • Real-Time Speech Commands
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-[#141414] dark:hover:text-white hover:bg-black/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mic Visualizer Center */}
        <div className="my-8 flex flex-col items-center justify-center text-center">
          <button
            onClick={toggleListening}
            className={`relative p-6 rounded-full transition-all duration-300 transform active:scale-95 ${
              isListening
                ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30 scale-110"
                : "bg-[#8266F0] text-white shadow-lg shadow-[#8266F0]/30 hover:scale-105"
            }`}
            aria-label={isListening ? "Stop listening" : "Start speech listening"}
          >
            {isListening ? <Mic className="w-8 h-8 animate-pulse" /> : <MicOff className="w-8 h-8" />}
            {isListening && (
              <span className="absolute -inset-2 rounded-full border-2 border-rose-500/40 animate-ping pointer-events-none" />
            )}
          </button>

          <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isListening ? "Listening now... speak your command" : "Click to speak"}
          </div>

          {transcript && (
            <p className="mt-3 text-sm font-medium text-[#8266F0] bg-[#8266F0]/10 px-4 py-2 rounded-xl">
              &ldquo;{transcript}&rdquo;
            </p>
          )}

          <p className="mt-4 text-sm text-[#141414] dark:text-slate-200 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10 leading-relaxed max-w-md">
            {assistantResponse}
          </p>
        </div>

        {/* Sample Trigger Pills */}
        <div className="pt-4 border-t border-black/5 dark:border-white/10">
          <span className="text-[11px] font-semibold text-[#6B6B6B] dark:text-slate-400 uppercase tracking-wider block mb-2">
            Sample Voice Commands:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              "nav:diagnostic",
              "give me a hint",
              "nav:library",
              "filter:class 9",
              "nav:pacing",
              "toggle:teacher",
              "help",
            ].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleVoiceCommand(cmd)}
                className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-[#8266F0]/15 hover:text-[#8266F0] transition"
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

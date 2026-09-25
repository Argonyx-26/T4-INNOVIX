import React, { useState } from "react";
import { Eye, Zap, BookOpenCheck, Settings2, X, Check } from "lucide-react";
import { useThemeMode } from "../context/ThemeModeContext";
import { ThemeMode } from "../types";

export const ModeToggleWidget: React.FC = () => {
  const { mode, setMode } = useThemeMode();
  const [isOpen, setIsOpen] = useState(false);

  const options: { id: ThemeMode; label: string; icon: React.ElementType; desc: string; badge?: string }[] = [
    {
      id: "normal",
      label: "Standard Editorial",
      icon: Eye,
      desc: "Editorial Fraunces typography with high-contrast warm gray canvas.",
    },
    {
      id: "adhd",
      label: "ADHD Focus Mode",
      icon: Zap,
      desc: "Warm glare-reducing cream, minimal peripheral distractions, and 4 semantic color buckets.",
      badge: "Focus",
    },
    {
      id: "dyslexic",
      label: "OpenDyslexic Mode",
      icon: BookOpenCheck,
      desc: "OpenDyslexic weighted typography, 1.85 line-spacing, interactive cursor reading ruler & audio assists.",
      badge: "OpenDyslexic",
    },
  ];

  return (
    <aside
      aria-label="Adaptive Neurodivergent Mode Switcher"
      className="fixed right-4 bottom-8 z-[45] flex flex-col items-end"
    >
      {/* Expanded Menu Popover */}
      {isOpen && (
        <div
          role="region"
          aria-label="Accessibility display modes"
          className="mb-3 w-80 rounded-3xl bg-white dark:bg-[#1E1E24] shadow-2xl border border-black/10 dark:border-white/10 p-5 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <Settings2 className="w-4 h-4 text-[#8266F0]" />
              <span className="font-display font-bold text-sm text-[#141414] dark:text-white">
                Adaptive Neurodivergent UI
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-[#141414] dark:hover:text-white transition"
              aria-label="Close widget"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setMode(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition border flex items-start space-x-3 ${
                    isSelected
                      ? "bg-[#8266F0]/10 border-[#8266F0] text-[#141414] dark:text-white"
                      : "bg-black/5 dark:bg-white/5 border-transparent text-[#6B6B6B] dark:text-slate-300 hover:border-black/10"
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${isSelected ? "bg-[#8266F0] text-white" : "bg-black/10 dark:bg-white/10 text-slate-600 dark:text-slate-300"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#141414] dark:text-white">
                        {opt.label}
                      </span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-[#8266F0]" />
                      ) : opt.badge ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-[#6B6B6B] dark:text-slate-300">
                          {opt.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-[#6B6B6B] dark:text-slate-400 leading-snug line-clamp-2">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-center text-[#6B6B6B] dark:text-slate-400 pt-2 border-t border-black/5 dark:border-white/10">
            Dynamically injects CSS tokens without altering domain logic.
          </p>
        </div>
      )}

      {/* Floating Pill Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center space-x-2.5 px-4 py-3 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border border-white/20"
        aria-label="Open adaptive mode switcher"
        title="Switch Neurodivergent Mode"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EC4899] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EC4899]" />
        </span>
        <span className="text-xs font-bold capitalize">
          Mode: {mode === "adhd" ? "ADHD Focus" : mode === "dyslexic" ? "Dyslexic" : "Normal"}
        </span>
        <Settings2 className="w-4 h-4 group-hover:rotate-45 transition-transform" />
      </button>
    </aside>
  );
};

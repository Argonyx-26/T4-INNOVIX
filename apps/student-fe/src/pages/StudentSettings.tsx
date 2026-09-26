import React, { useState } from "react";
import { 
  User, 
  Settings, 
  GraduationCap, 
  BookOpenCheck, 
  Eye, 
  Volume2, 
  Bell, 
  Shield, 
  CheckCircle2, 
  Sliders, 
  Sparkles,
  Zap
} from "lucide-react";
import { useThemeMode } from "../context/ThemeModeContext";
import { useAuth } from "../context/AuthContext";
import { AcademicTier, AcademicDiscipline } from "../types";

export const StudentSettings: React.FC = () => {
  const { mode, setMode, addToast } = useThemeMode();
  const { user, role, switchRole } = useAuth();
  const [rulerActive, setRulerActive] = useState<boolean>(true);

  const [displayName, setDisplayName] = useState(user?.displayName || "Alex Chen");
  const [selectedTier, setSelectedTier] = useState<AcademicTier>(user?.academicTier || "Undergraduate (UG)");
  const [selectedDiscipline, setSelectedDiscipline] = useState<AcademicDiscipline>("Computer Science");
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      title: "Profile Preferences Saved",
      description: "Your academic profile & cognitive settings have been updated.",
      type: "success",
    });
  };

  return (
    <div className="min-h-screen py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand/10 text-brand dark:bg-brand/20 font-bold text-xs tracking-wider uppercase mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences & Accessibility</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            Student Settings
          </h1>
          <p className="adhd-hide text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Configure your academic level, cognitive accessibility modes, and voice assistant parameters.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-8">
        
        {/* 1. Academic & Personal Profile */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-neutral-900 dark:text-white">
                Academic Identity
              </h2>
              <p className="adhd-hide text-xs text-neutral-500">Sets the baseline for AI diagnostic calibrations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || "alex.chen@university.edu"}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Academic Tier
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as AcademicTier)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="School (K-12)">School (K-12)</option>
                <option value="Undergraduate (UG)">Undergraduate (UG)</option>
                <option value="Postgraduate (PG)">Postgraduate (PG)</option>
                <option value="Professional">Professional / Lifelong</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Primary Discipline
              </label>
              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value as AcademicDiscipline)}
                className="w-full px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Medicine & Physiology">Medicine & Physiology</option>
                <option value="Commerce & Finance">Commerce & Finance</option>
                <option value="Law & Humanities">Law & Humanities</option>
                <option value="Natural Sciences">Natural Sciences</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Cognitive Accessibility Controls */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-neutral-900 dark:text-white">
                Cognitive & Accessibility Modes
              </h2>
              <p className="adhd-hide text-xs text-neutral-500">Universal design for neurodivergent learners</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setMode("normal")}
              className={`p-4 rounded-2xl border text-left space-y-1.5 transition ${
                mode === "normal"
                  ? "bg-brand/10 border-brand text-neutral-900 dark:text-white"
                  : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Standard</span>
                {mode === "normal" && <CheckCircle2 className="w-4 h-4 text-brand" />}
              </div>
              <p className="text-[11px] leading-relaxed">Balanced layout and default typography</p>
            </button>

            <button
              type="button"
              onClick={() => setMode("adhd")}
              className={`p-4 rounded-2xl border text-left space-y-1.5 transition ${
                mode === "adhd"
                  ? "bg-amber-500/15 border-amber-500 text-neutral-900 dark:text-white"
                  : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">ADHD Focus</span>
                {mode === "adhd" && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
              </div>
              <p className="text-[11px] leading-relaxed">Warm theme with less text, to focus on one thing at a time</p>
            </button>

            <button
              type="button"
              onClick={() => setMode("dyslexic")}
              className={`p-4 rounded-2xl border text-left space-y-1.5 transition ${
                mode === "dyslexic"
                  ? "bg-emerald-500/15 border-emerald-500 text-neutral-900 dark:text-white"
                  : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">OpenDyslexic</span>
                {mode === "dyslexic" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-[11px] leading-relaxed">Weighted bottom glyphs to prevent letter rotation</p>
            </button>
          </div>

          {/* Interactive Reading Ruler Toggle */}
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-brand" />
                <span>Interactive Reading Ruler</span>
              </span>
              <p className="adhd-hide text-[11px] text-neutral-500">
                Horizontal tracking beam that follows your mouse cursor across text
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRulerActive(!rulerActive);
                if (mode !== "dyslexic") setMode("dyslexic");
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                rulerActive && mode === "dyslexic" ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                rulerActive && mode === "dyslexic" ? "translate-x-7" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>

        {/* 3. Voice & Audio Preferences */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-neutral-900 dark:text-white">
                Speech & Audio Assistant
              </h2>
              <p className="adhd-hide text-xs text-neutral-500">Web Speech API synthesis for auditory learning</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
              <span>Speech Playback Speed ({speechRate}x)</span>
              <span className="text-neutral-400 font-normal">Normal is 1.0x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-brand"
            />
          </div>
        </div>

        {/* 4. Role Switcher for Evaluators */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EC4899]/10 text-[#EC4899] flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-neutral-900 dark:text-white">
                  Application Role Perspective
                </h2>
                <p className="text-xs text-neutral-500">Currently active role: <span className="font-bold uppercase text-brand">{role}</span></p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => switchRole(role === "student" ? "teacher" : "student")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#EC4899]/10 text-[#EC4899] hover:bg-[#EC4899]/20 transition border border-[#EC4899]/20"
            >
              Switch to {role === "student" ? "Teacher Portal" : "Student View"}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-brand to-[#EC4899] text-white hover:opacity-95 shadow-lg shadow-brand/25 transition flex items-center space-x-2"
          >
            <span>Save Preferences</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>

      </form>

    </div>
  );
};

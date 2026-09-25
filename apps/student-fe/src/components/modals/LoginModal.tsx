import React, { useState, useEffect } from "react";
import { X, User, Lock, Sparkles, GraduationCap, ShieldCheck } from "lucide-react";
import { useThemeMode } from "../../context/ThemeModeContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useThemeMode();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [email, setEmail] = useState("student.demo@eduvia.ai");
  const [password, setPassword] = useState("••••••••••••");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDemoFill = (selectedRole: "student" | "teacher") => {
    setRole(selectedRole);
    if (selectedRole === "student") {
      setEmail("student.demo@eduvia.ai");
    } else {
      setEmail("teacher.hod@eduvia.ai");
    }
    setPassword("learnlens-secure-demo-pass");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      "Authenticated Successfully",
      `Logged in as ${role === "student" ? "Class 9 Learner" : "Senior Mathematics Educator"}. Telemetry synced.`,
      "success"
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden transform animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-[#8266F0]/15 text-[#8266F0]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#141414] dark:text-white">
                LearnLens Authentication
              </h3>
              <p className="text-xs text-[#6B6B6B] dark:text-slate-400">
                Cognitive State & Session Sync
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

        {/* Role Segment Toggle */}
        <div className="my-6 grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <button
            type="button"
            onClick={() => handleDemoFill("student")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              role === "student"
                ? "bg-white dark:bg-[#25252D] text-[#8266F0] shadow-sm"
                : "text-[#6B6B6B] dark:text-slate-400 hover:text-[#141414]"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Login</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoFill("teacher")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              role === "teacher"
                ? "bg-white dark:bg-[#25252D] text-[#EC4899] shadow-sm"
                : "text-[#6B6B6B] dark:text-slate-400 hover:text-[#141414]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Teacher Portal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">
              Eduvia ID / Institutional Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#8266F0] to-[#EC4899] hover:opacity-95 shadow-md shadow-[#8266F0]/25 transition"
          >
            Sign in as {role === "student" ? "Learner" : "Educator"}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10 text-center">
          <button
            onClick={() => handleDemoFill(role)}
            className="text-xs text-[#8266F0] font-semibold hover:underline"
          >
            Pre-fill Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

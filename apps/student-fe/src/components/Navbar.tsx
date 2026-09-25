import React, { useState } from "react";
import { 
  Sparkles, 
  Search, 
  Mic, 
  User, 
  Menu, 
  X, 
  GraduationCap, 
  BarChart3, 
  BookOpen, 
  Compass, 
  Users, 
  Flame,
  Library,
  BookOpenCheck
} from "lucide-react";
import { useThemeMode } from "../context/ThemeModeContext";

interface NavbarProps {
  activeHash: string;
  onOpenVoice: () => void;
  onOpenSearch: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeHash,
  onOpenVoice,
  onOpenSearch,
  onOpenLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mode, setMode } = useThemeMode();

  const navLinks = [
    { label: "Home", hash: "#home", icon: Compass },
    { label: "AI Diagnostic", hash: "#diagnostic", icon: Sparkles, badge: "Live" },
    { label: "Curriculum", hash: "#courses", icon: BookOpen },
    { label: "Library", hash: "#library", icon: Library, badge: "RAG" },
    { label: "Adaptive Pacing", hash: "#pacing", icon: Flame },
    { label: "Learning Paths", hash: "#paths", icon: GraduationCap },
    { label: "Instructors", hash: "#mentors", icon: Users },
    { label: "Teacher Intelligence", hash: "#teacher", icon: BarChart3, badge: "Vector" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full transition-colors duration-200 border-b border-black/5 bg-[#EFEFEE] dark:bg-[#17171B] site-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Status Indicator */}
        <div className="flex items-center space-x-3">
          <a href="#home" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8266F0] to-[#EC4899] flex items-center justify-center text-white shadow-md shadow-[#8266F0]/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-display font-bold text-2xl tracking-tight text-[#141414] dark:text-white">
                  Eduvia
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#8266F0]/15 text-[#8266F0] dark:bg-[#8266F0]/30 dark:text-[#a794ff]">
                  LearnLens AI
                </span>
              </div>
            </div>
          </a>

          {/* Live Badge */}
          <div className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>LEARN WITHOUT LIMITS</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navLinks.map((item) => {
            const isActive = activeHash === item.hash;
            const Icon = item.icon;
            return (
              <a
                key={item.hash}
                href={item.hash}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? "text-[#8266F0] bg-[#8266F0]/10 dark:bg-white/10 dark:text-white font-semibold"
                    : "text-[#6B6B6B] dark:text-slate-300 hover:text-[#141414] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 opacity-75" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#EC4899] text-white">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Global Action Header Items */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2.5 rounded-xl text-[#6B6B6B] dark:text-slate-300 hover:text-[#141414] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center space-x-1.5 text-xs font-medium"
            title="Quick Search (Cmd+K)"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline text-[11px] opacity-60 bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded">
              ⌘K
            </span>
          </button>

          {/* OpenDyslexic Font Quick Toggle */}
          <button
            onClick={() => setMode(mode === "dyslexic" ? "normal" : "dyslexic")}
            className={`p-2.5 rounded-xl transition flex items-center space-x-1.5 text-xs font-semibold ${
              mode === "dyslexic"
                ? "bg-[#10B981] text-white shadow-sm"
                : "text-[#6B6B6B] dark:text-slate-300 hover:text-[#141414] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            title="Toggle OpenDyslexic Weighted Font"
          >
            <BookOpenCheck className="w-4 h-4" />
            <span className="hidden xl:inline">OpenDyslexic</span>
          </button>

          {/* Voice Assistant Trigger */}
          <button
            onClick={onOpenVoice}
            className="p-2.5 rounded-xl text-[#8266F0] bg-[#8266F0]/10 hover:bg-[#8266F0]/20 transition flex items-center space-x-1.5 text-xs font-medium"
            title="Speech Assistant (Web Speech API)"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Voice Coach</span>
          </button>

          {/* Login / Profile Button */}
          <button
            onClick={onOpenLogin}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#141414] dark:bg-white dark:text-[#141414] hover:opacity-90 shadow-sm transition flex items-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Log in</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#141414] dark:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-black/5 bg-[#EFEFEE] dark:bg-[#17171B] px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeHash === item.hash;
            return (
              <a
                key={item.hash}
                href={item.hash}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-medium ${
                  isActive
                    ? "bg-[#8266F0] text-white font-semibold"
                    : "text-[#141414] dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[#EC4899] text-white">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}

          <button
            onClick={() => {
              setMode(mode === "dyslexic" ? "normal" : "dyslexic");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition ${
              mode === "dyslexic"
                ? "bg-[#10B981] text-white"
                : "bg-black/5 dark:bg-white/10 text-[#141414] dark:text-white"
            }`}
          >
            <div className="flex items-center space-x-3">
              <BookOpenCheck className="w-5 h-5" />
              <span>OpenDyslexic Font</span>
            </div>
            <span className="text-xs">{mode === "dyslexic" ? "Enabled ✓" : "Enable"}</span>
          </button>
        </div>
      )}
    </header>
  );
};

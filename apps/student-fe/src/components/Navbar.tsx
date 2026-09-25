import React, { useState, useRef, useEffect } from "react";
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
  BookOpenCheck,
  ChevronDown,
  LayoutDashboard,
  Activity,
  Target,
  FileText,
  Calendar,
  Settings,
  MessageSquare,
  ArrowLeftRight,
  LogOut,
  Radio
} from "lucide-react";
import { useThemeMode } from "../context/ThemeModeContext";
import { useAuth } from "../context/AuthContext";

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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const { mode, setMode } = useThemeMode();
  const { user, role, switchRole, logout } = useAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on hash change
  useEffect(() => {
    setActiveDropdown(null);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [activeHash]);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(prev => prev === name ? null : name);
    setProfileDropdownOpen(false);
  };

  const isTeacher = role === "teacher";

  return (
    <header className="sticky top-0 z-40 w-full transition-colors duration-200 border-b border-black/5 bg-[#EFEFEE] dark:bg-[#17171B] site-header" ref={dropdownRef}>
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Context Indicator */}
        <div className="flex items-center space-x-3">
          <a href="#home" className="flex items-center space-x-2.5 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform ${
              isTeacher 
                ? "bg-gradient-to-tr from-[#EC4899] to-[#8266F0] shadow-[#EC4899]/25" 
                : "bg-gradient-to-tr from-[#8266F0] to-[#EC4899] shadow-[#8266F0]/25"
            }`}>
              {isTeacher ? <Radio className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-display font-bold text-2xl tracking-tight text-[#141414] dark:text-white">
                  Eduvia
                </span>
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                  isTeacher 
                    ? "bg-[#EC4899]/15 text-[#EC4899] dark:bg-[#EC4899]/30" 
                    : "bg-[#8266F0]/15 text-[#8266F0] dark:bg-[#8266F0]/30 dark:text-[#a794ff]"
                }`}>
                  {isTeacher ? "Faculty Portal" : "LearnLens AI"}
                </span>
              </div>
            </div>
          </a>

          {/* Status Badge */}
          <div className="hidden xl:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isTeacher ? "FACULTY TELEMETRY LIVE" : "LEARN WITHOUT LIMITS"}</span>
          </div>
        </div>

        {/* Desktop Navigation - Condensed into a Dropdown */}


        {/* Global Action Header Items */}
        <div className="flex items-center space-x-2 sm:space-x-3">

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2.5 rounded-xl text-[#6B6B6B] dark:text-slate-300 hover:text-[#141414] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center space-x-1.5 text-xs font-medium"
            title="Quick Search (Cmd+K)"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline text-[11px] opacity-60 bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">
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

          {/* Profile / Role Switcher Popover Trigger */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1 sm:pr-3 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition border border-black/5 dark:border-white/10"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-[#8266F0]"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                    isTeacher ? "bg-gradient-to-tr from-[#EC4899] to-[#8266F0]" : "bg-gradient-to-tr from-[#8266F0] to-[#10B981]"
                  }`}>
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-[#141414] dark:text-white leading-tight truncate max-w-[100px]">
                    {user.displayName?.split(" ")[0]}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                      isTeacher ? "text-[#EC4899]" : "text-[#10B981]"
                    }`}>
                      {isTeacher ? "Faculty" : "Student"}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown Popover */}
              {profileDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#1E1E24] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-3 space-y-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2 border-b border-black/5 dark:border-white/5 space-y-0.5">
                    <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {user.displayName}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {user.email}
                    </div>
                  </div>



                  <a
                    href="#settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4 text-neutral-500" />
                    <span>Settings & Accessibility</span>
                  </a>

                  <button
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold transition flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#141414] dark:bg-white dark:text-[#141414] hover:opacity-90 shadow-sm transition flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Log in</span>
            </button>
          )}

          {/* Desktop Menu Dropdown */}
          <div className="hidden lg:block relative">
            <button
              onClick={() => toggleDropdown("desktop_menu")}
              className={`p-2 rounded-xl transition flex items-center space-x-2 ${
                activeDropdown === "desktop_menu"
                  ? "bg-black/5 dark:bg-white/5 text-[#141414] dark:text-white"
                  : "text-[#6B6B6B] dark:text-slate-300 hover:text-[#141414] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              title="Main Menu"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden xl:inline text-sm font-semibold pr-1">Menu</span>
            </button>

            {activeDropdown === "desktop_menu" && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#1E1E24] rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {isTeacher ? (
                  <>
                    <a href="#teacher" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <LayoutDashboard className="w-4 h-4 text-neutral-500" />
                      <span>Overview</span>
                    </a>
                    <a href="#teacher-triage" onClick={() => setActiveDropdown(null)} className="flex items-center justify-between p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <div className="flex items-center space-x-3">
                        <Activity className="w-4 h-4 text-rose-500" />
                        <span>Live Triage</span>
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">Live</span>
                    </a>
                    <a href="#teacher-students" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <Users className="w-4 h-4 text-neutral-500" />
                      <span>Students</span>
                    </a>
                    <a href="#teacher-analytics" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <BarChart3 className="w-4 h-4 text-neutral-500" />
                      <span>Analytics</span>
                    </a>
                    <a href="#teacher-interventions" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <Target className="w-4 h-4 text-neutral-500" />
                      <span>Interventions</span>
                    </a>
                    <a href="#teacher-intelligence" onClick={() => setActiveDropdown(null)} className="flex items-center justify-between p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="w-4 h-4 text-[#EC4899]" />
                        <span>RAG Chatbot</span>
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#EC4899] text-white">Vector</span>
                    </a>
                  </>
                ) : (
                  <>
                    <a href="#student" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <LayoutDashboard className="w-4 h-4 text-neutral-500" />
                      <span>Dashboard</span>
                    </a>
                    <div className="h-px bg-black/5 dark:bg-white/5 my-1" />
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Learn</div>
                    <a href="#courses" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <BookOpen className="w-4 h-4 text-[#8266F0]" />
                      <span>Courses</span>
                    </a>
                    <a href="#paths" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <GraduationCap className="w-4 h-4 text-[#EC4899]" />
                      <span>Learning Paths</span>
                    </a>
                    <a href="#self-study" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <BookOpenCheck className="w-4 h-4 text-[#10B981]" />
                      <span>Self Study</span>
                    </a>
                    <div className="h-px bg-black/5 dark:bg-white/5 my-1" />
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Practice</div>
                    <a href="#diagnostic" onClick={() => setActiveDropdown(null)} className="flex items-center justify-between p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-4 h-4 text-[#8266F0]" />
                        <span>AI Diagnostic</span>
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#EC4899] text-white">Live</span>
                    </a>
                    <a href="#pacing" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>Adaptive Learning</span>
                    </a>
                    <div className="h-px bg-black/5 dark:bg-white/5 my-1" />
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">My Learning</div>
                    <a href="#misconceptions" onClick={() => setActiveDropdown(null)} className="flex items-center justify-between p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <div className="flex items-center space-x-3">
                        <Activity className="w-4 h-4 text-rose-500" />
                        <span>Misconception Center</span>
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#8266F0] text-white">Core</span>
                    </a>
                    <a href="#diagnostic-results" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <span>Diagnostic Reports</span>
                    </a>
                    <a href="#plan" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <Calendar className="w-4 h-4 text-[#8266F0]" />
                      <span>Study Plan</span>
                    </a>
                    <div className="h-px bg-black/5 dark:bg-white/5 my-1" />
                    <a href="#library" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <Library className="w-4 h-4 text-neutral-500" />
                      <span>Resources</span>
                    </a>
                    <a href="#mentors" onClick={() => setActiveDropdown(null)} className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5">
                      <Users className="w-4 h-4 text-neutral-500" />
                      <span>Mentors</span>
                    </a>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#141414] dark:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-black/5 bg-[#EFEFEE] dark:bg-[#17171B] px-4 pt-3 pb-6 space-y-3 max-h-[85vh] overflow-y-auto">
          {isTeacher ? (
            /* TEACHER MOBILE MENU */
            <div className="space-y-1">
              {[
                { label: "Overview", hash: "#teacher", icon: LayoutDashboard },
                { label: "Live Triage", hash: "#teacher-triage", icon: Activity, badge: "Live" },
                { label: "Students", hash: "#teacher-students", icon: Users },
                { label: "Analytics", hash: "#teacher-analytics", icon: BarChart3 },
                { label: "Interventions", hash: "#teacher-interventions", icon: Target },
                { label: "RAG Chatbot", hash: "#teacher-intelligence", icon: MessageSquare, badge: "Vector" },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeHash === item.hash;
                return (
                  <a
                    key={item.hash}
                    href={item.hash}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl text-sm font-semibold ${
                      isActive
                        ? "bg-[#8266F0] text-white"
                        : "text-[#141414] dark:text-slate-200 hover:bg-black/5"
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
            </div>
          ) : (
            /* STUDENT MOBILE MENU (Grouped by Intent) */
            <div className="space-y-4">
              <div>
                <a
                  href="#student"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 p-3 rounded-xl text-sm font-bold ${
                    activeHash === "#student" ? "bg-[#8266F0] text-white" : "text-[#141414] dark:text-slate-200"
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </a>
              </div>

              {/* Learn Group */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3">
                  Learn
                </div>
                <a
                  href="#courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5"
                >
                  <BookOpen className="w-4 h-4 text-[#8266F0]" />
                  <span>Courses</span>
                </a>
                <a
                  href="#paths"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5"
                >
                  <GraduationCap className="w-4 h-4 text-[#EC4899]" />
                  <span>Learning Paths</span>
                </a>
                <a
                  href="#self-study"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5"
                >
                  <BookOpenCheck className="w-4 h-4 text-[#10B981]" />
                  <span>Self Study</span>
                </a>
              </div>

              {/* Practice Group */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3">
                  Practice
                </div>
                <a
                  href="#diagnostic"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5"
                >
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-4 h-4 text-[#8266F0]" />
                    <span>AI Diagnostic</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[#EC4899] text-white">Live</span>
                </a>
                <a
                  href="#pacing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5"
                >
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Adaptive Learning</span>
                </a>
              </div>

              {/* My Learning Group */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3">
                  My Learning
                </div>
                <a
                  href="#misconceptions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5"
                >
                  <div className="flex items-center space-x-3">
                    <Activity className="w-4 h-4 text-rose-500" />
                    <span>Misconception Center</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-[#8266F0] text-white">Core</span>
                </a>
                <a
                  href="#diagnostic-results"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5"
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Diagnostic Reports</span>
                </a>
                <a
                  href="#plan"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5"
                >
                  <Calendar className="w-4 h-4 text-[#8266F0]" />
                  <span>Study Plan</span>
                </a>
              </div>

              {/* Resources & Mentors */}
              <div className="space-y-1 pt-1 border-t border-black/5 dark:border-white/5">
                <a
                  href="#library"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5"
                >
                  <Library className="w-4 h-4" />
                  <span>Resources</span>
                </a>
                <a
                  href="#mentors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5"
                >
                  <Users className="w-4 h-4" />
                  <span>Mentors</span>
                </a>
                <a
                  href="#settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 p-2.5 rounded-xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/5"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </a>
              </div>
            </div>
          )}

          {/* Dyslexic Toggle Mobile */}
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

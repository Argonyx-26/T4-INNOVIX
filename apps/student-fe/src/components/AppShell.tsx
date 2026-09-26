import React, { useEffect, useRef, useState } from "react";
import {
  Home,
  BookOpen,
  GraduationCap,
  CalendarDays,
  BarChart3,
  CalendarClock,
  FileText,
  Settings,
  Search,
  Mic,
  ChevronDown,
  Menu,
  X,
  Target,
  Brain,
  Users,
  NotebookPen,
  LogOut,
  Eye,
  Zap,
  BookOpenCheck,
  Check,
  Bot,
  LayoutDashboard,
  Activity,
  GitCompare,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeModeContext";
import { ThemeMode } from "../types";

export type ShellRole = "student" | "teacher";

interface AppShellProps {
  role: ShellRole;
  activeHash: string;
  onNavigate: (hash: string) => void;
  onOpenSearch: () => void;
  onOpenVoice: () => void;
  children: React.ReactNode;
}

type NavItem = { hash: string; label: string; icon: React.ElementType };

const STUDENT_SIDEBAR: NavItem[] = [
  { hash: "#student", label: "Dashboard", icon: Home },
  { hash: "#ai-tutor", label: "AI Tutor", icon: Bot },
  { hash: "#courses", label: "Courses", icon: BookOpen },
  { hash: "#paths", label: "Learning Paths", icon: GraduationCap },
  { hash: "#plan", label: "Study Plan", icon: CalendarDays },
  { hash: "#diagnostic-results", label: "Diagnostic Report", icon: BarChart3 },
  { hash: "#pacing", label: "Adaptive Pacing", icon: CalendarClock },
  { hash: "#library", label: "Resource Library", icon: FileText },
  { hash: "#settings", label: "Settings", icon: Settings },
];

const STUDENT_MENU: { title: string; items: NavItem[] }[] = [
  {
    title: "Learn",
    items: [
      { hash: "#student", label: "Dashboard", icon: Home },
      { hash: "#ai-tutor", label: "AI Tutor & Tests", icon: Bot },
      { hash: "#diagnostic", label: "Diagnostic Challenge", icon: Target },
      { hash: "#misconceptions", label: "Misconceptions", icon: Brain },
      { hash: "#diagnostic-results", label: "Diagnostic Report", icon: BarChart3 },
    ],
  },
  {
    title: "Courses & paths",
    items: [
      { hash: "#courses", label: "Courses", icon: BookOpen },
      { hash: "#paths", label: "Learning Paths", icon: GraduationCap },
      { hash: "#pacing", label: "Adaptive Pacing", icon: CalendarClock },
    ],
  },
  {
    title: "Plan & resources",
    items: [
      { hash: "#plan", label: "Study Plan", icon: CalendarDays },
      { hash: "#library", label: "Resource Library", icon: FileText },
      { hash: "#self-study", label: "Self-Study Studio", icon: NotebookPen },
      { hash: "#mentors", label: "Mentors", icon: Users },
      { hash: "#settings", label: "Settings", icon: Settings },
    ],
  },
];

const TEACHER_SIDEBAR: NavItem[] = [
  { hash: "#teacher", label: "Overview", icon: LayoutDashboard },
  { hash: "#teacher-intelligence", label: "Student Insights", icon: MessageSquare },
  { hash: "#teacher-triage", label: "Live Triage", icon: Activity },
  { hash: "#teacher-students", label: "Student Comparison", icon: GitCompare },
  { hash: "#teacher-analytics", label: "Cohort Analytics", icon: BarChart3 },
  { hash: "#teacher-interventions", label: "Interventions & Pods", icon: Users },
  { hash: "#library", label: "Resource Library", icon: FileText },
  { hash: "#settings", label: "Settings", icon: Settings },
];

const TEACHER_MENU: { title: string; items: NavItem[] }[] = [
  {
    title: "Teaching",
    items: [
      { hash: "#teacher", label: "Overview", icon: LayoutDashboard },
      { hash: "#teacher-intelligence", label: "Student Insights", icon: MessageSquare },
      { hash: "#teacher-triage", label: "Live Triage", icon: Activity },
    ],
  },
  {
    title: "Analysis",
    items: [
      { hash: "#teacher-students", label: "Student Comparison", icon: GitCompare },
      { hash: "#teacher-analytics", label: "Cohort Analytics", icon: BarChart3 },
      { hash: "#teacher-interventions", label: "Interventions & Pods", icon: Users },
    ],
  },
  {
    title: "Resources",
    items: [
      { hash: "#courses", label: "Courses", icon: BookOpen },
      { hash: "#library", label: "Resource Library", icon: FileText },
      { hash: "#settings", label: "Settings", icon: Settings },
    ],
  },
];

const NAV: Record<ShellRole, { home: string; sidebar: NavItem[]; menu: { title: string; items: NavItem[] }[] }> = {
  student: { home: "#student", sidebar: STUDENT_SIDEBAR, menu: STUDENT_MENU },
  teacher: { home: "#teacher", sidebar: TEACHER_SIDEBAR, menu: TEACHER_MENU },
};

const MODE_OPTIONS: { id: ThemeMode; label: string; icon: React.ElementType }[] = [
  { id: "normal", label: "Standard", icon: Eye },
  { id: "adhd", label: "ADHD Focus", icon: Zap },
  { id: "dyslexic", label: "Dyslexic", icon: BookOpenCheck },
];

// The role's home also covers "#home" and an empty hash, which render that role's dashboard.
const isActive = (itemHash: string, activeHash: string, home: string) =>
  itemHash === home ? activeHash === home || activeHash === "#home" || activeHash === "" : itemHash === activeHash;

export const Avatar: React.FC<{ name?: string; photoURL?: string; className?: string }> = ({ 
  name = "Learner", 
  photoURL, 
  className = "" 
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [photoURL]);

  const cleanName = (name || "Learner").trim();
  const defaultAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`;

  const isValidPhoto = Boolean(
    photoURL && 
    typeof photoURL === "string" && 
    photoURL.trim() !== "" && 
    photoURL !== "null" && 
    photoURL !== "undefined"
  );

  const srcToUse = isValidPhoto && !imgError ? photoURL : defaultAvatarUrl;

  return (
    <div className={`relative rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-[#B9A6FB] to-brand grid place-items-center ${className}`}>
      <img
        src={srcToUse}
        alt=""
        onError={() => setImgError(true)}
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
};

export const AppShell: React.FC<AppShellProps> = ({ role, activeHash, onNavigate, onOpenSearch, onOpenVoice, children }) => {
  const nav = NAV[role];
  const { user, logout } = useAuth();
  const { mode, setMode } = useThemeMode();
  const [openMenu, setOpenMenu] = useState<"profile" | "pages" | null>(null);
  const menusRef = useRef<HTMLDivElement>(null);

  const name = user?.displayName || "Learner";

  useEffect(() => setOpenMenu(null), [activeHash]);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (menusRef.current && !menusRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenMenu(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const toggle = (menu: "profile" | "pages") => setOpenMenu((cur) => (cur === menu ? null : menu));
  const dyslexicOn = mode === "dyslexic";

  return (
    <div className="min-h-screen bg-canvas text-[#1F2230]">
      {/* Sidebar */}
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 z-[100] w-[74px] flex-col items-center justify-between rounded-[28px] bg-sidebar py-5 shadow-sm select-none">
        {/* Top Brand Logo */}
        <button 
          onClick={() => onNavigate(nav.home)} 
          aria-label="Eduvia dashboard" 
          className="mb-2 shrink-0 rounded-2xl group relative"
        >
          <img src="/dashboard/logo.png" alt="" className="w-10 h-10 object-contain transition-transform duration-200 group-hover:scale-110" />
          {/* Unclipped High Z-Index Tooltip */}
          <span className="pointer-events-none absolute left-[68px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[#18181B] text-white px-3 py-1.5 text-xs font-bold shadow-2xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-[100] flex items-center">
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#18181B] rotate-45" />
            <span className="relative z-10">{role === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}</span>
          </span>
        </button>

        {/* Center Nav List */}
        <nav aria-label="Main" className="flex-1 flex flex-col items-center justify-evenly gap-2 sm:gap-2.5 py-2 w-full min-h-0">
          {nav.sidebar.map((item) => {
            const active = isActive(item.hash, activeHash, nav.home);
            return (
              <button
                key={item.hash}
                onClick={() => onNavigate(item.hash)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`group relative w-12 h-12 shrink-0 rounded-2xl grid place-items-center transition-all duration-200 ${
                  active 
                    ? "bg-nav text-nav-ink font-bold shadow-md scale-105" 
                    : "text-[#3A3D4A] hover:bg-black/5 hover:text-[#8266F0] hover:scale-105"
                }`}
              >
                <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.75} />
                {/* Floating Hover Tooltip Badge */}
                <span className="pointer-events-none absolute left-[68px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[#18181B] text-white px-3 py-1.5 text-xs font-bold shadow-2xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-[100] flex items-center">
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#18181B] rotate-45" />
                  <span className="relative z-10">{item.label}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Button */}
        <button
          onClick={() => onNavigate("#settings")}
          aria-label="Profile settings"
          className="group relative mt-2 shrink-0 rounded-full ring-2 ring-white hover:ring-[#8266F0] transition-all duration-200"
        >
          <Avatar name={name} photoURL={user?.photoURL} className="w-10 h-10 text-sm transition-transform duration-200 group-hover:scale-105" />
          <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-[#1BBC7E] ring-2 ring-sidebar" aria-hidden="true" />
          {/* Floating Hover Tooltip Badge */}
          <span className="pointer-events-none absolute left-[68px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-[#18181B] text-white px-3 py-1.5 text-xs font-bold shadow-2xl opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-[100] flex items-center">
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#18181B] rotate-45" />
            <span className="relative z-10">Profile &amp; Settings ({name})</span>
          </span>
        </button>
      </aside>

      <div className="lg:pl-[108px]">
        {/* Top bar */}
        <header className="sticky top-0 z-[500] bg-canvas/90 backdrop-blur">
          <div ref={menusRef} className="relative flex items-center gap-3 px-4 sm:px-6 h-20">
            <button onClick={() => onNavigate(nav.home)} aria-label="Eduvia dashboard" className="lg:hidden shrink-0">
              <img src="/dashboard/logo.png" alt="" className="w-10 h-10 object-contain" />
            </button>

            <button
              onClick={onOpenSearch}
              className="flex-1 min-w-0 max-w-[470px] mx-auto h-12 rounded-full border border-black/10 bg-fill hover:border-black/20 px-4 sm:px-5 flex items-center gap-3 text-left text-sm text-[#8A8C95] transition"
            >
              <Search className="w-5 h-5 text-[#3A3D4A] shrink-0" />
              <span className="flex-1 truncate">Search courses, lessons, tools…</span>
              <kbd className="hidden md:inline text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/5">Ctrl K</kbd>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <button
                onClick={() => setMode(dyslexicOn ? "normal" : "dyslexic")}
                aria-pressed={dyslexicOn}
                aria-label="OpenDyslexic reading font"
                title="OpenDyslexic reading font"
                className={`hidden sm:grid w-12 h-12 place-items-center rounded-2xl transition ${
                  dyslexicOn ? "bg-[#1BBC7E] text-white" : "text-[#1F2230] hover:bg-black/5"
                }`}
              >
                <BookOpen className="w-6 h-6" strokeWidth={1.75} />
              </button>

              <button
                onClick={onOpenVoice}
                className="hidden sm:flex h-12 px-4 lg:px-6 rounded-2xl bg-brand-soft hover:bg-[#E3DAFD] text-brand-strong items-center gap-2 text-sm font-semibold transition"
              >
                <Mic className="w-5 h-5" />
                <span className="hidden lg:inline">Voice Coach</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => toggle("profile")}
                  aria-haspopup="menu"
                  aria-expanded={openMenu === "profile"}
                  aria-label="Account menu"
                  className="h-12 pl-1.5 pr-2 sm:pr-3 rounded-2xl bg-fill hover:bg-fill-hover flex items-center gap-2.5 transition"
                >
                  <Avatar name={name} photoURL={user?.photoURL} className="w-9 h-9 text-sm" />
                  <ChevronDown className={`w-4 h-4 transition ${openMenu === "profile" ? "rotate-180" : ""}`} />
                </button>
                {openMenu === "profile" && (
                  <div role="menu" className="absolute right-0 top-full mt-2 w-80 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/10 dark:border-white/10 shadow-2xl p-4 z-[9999] animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-3.5 p-2 pb-3.5 border-b border-black/10 dark:border-white/10">
                      <Avatar name={name} photoURL={user?.photoURL} className="w-12 h-12 text-base shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold truncate text-[#1F2230] dark:text-white">{name}</div>
                        <div className="text-xs text-[#8A8C95] dark:text-neutral-400 truncate">{user?.email}</div>
                      </div>
                    </div>
                    <div className="px-2 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#8A8C95] dark:text-neutral-400">Reading mode</div>
                    {MODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        role="menuitemradio"
                        aria-checked={mode === opt.id}
                        onClick={() => setMode(opt.id)}
                        className={`w-full px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 text-sm transition ${
                          mode === opt.id ? "bg-nav font-bold text-nav-ink" : "hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200"
                        }`}
                      >
                        <opt.icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{opt.label}</span>
                        {mode === opt.id && <Check className="w-4 h-4 text-nav-ink shrink-0" />}
                      </button>
                    ))}
                    <div className="my-2 border-t border-black/10 dark:border-white/10" />
                    <button
                      role="menuitem"
                      onClick={() => onNavigate("#settings")}
                      className="w-full px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200"
                    >
                      <Settings className="w-4 h-4" /> Settings & profile
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => {
                        setOpenMenu(null);
                        logout();
                        onNavigate("#home");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => toggle("pages")}
                  aria-haspopup="menu"
                  aria-expanded={openMenu === "pages"}
                  aria-label="All pages"
                  className="w-12 h-12 grid place-items-center rounded-2xl bg-fill hover:bg-fill-hover transition"
                >
                  {openMenu === "pages" ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                {openMenu === "pages" && (
                  <div role="menu" className="absolute right-0 top-full mt-2 w-[min(92vw,560px)] rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/10 dark:border-white/10 shadow-2xl p-4 z-[9999] grid sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
                    {nav.menu.map((group) => (
                      <div key={group.title}>
                        <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#8A8C95]">{group.title}</div>
                        {group.items.map((item) => {
                          const active = isActive(item.hash, activeHash, nav.home);
                          return (
                            <button
                              key={item.hash}
                              role="menuitem"
                              onClick={() => onNavigate(item.hash)}
                              aria-current={active ? "page" : undefined}
                              className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-sm text-left transition ${
                                active ? "bg-nav font-bold text-[#0B6B47]" : "hover:bg-black/5"
                              }`}
                            >
                              <item.icon className="w-4 h-4 shrink-0" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                    <div className="sm:hidden border-t border-black/5 pt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setOpenMenu(null);
                          onOpenVoice();
                        }}
                        className="flex-1 h-11 rounded-2xl bg-brand-soft text-brand-strong text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Mic className="w-4 h-4" /> Voice Coach
                      </button>
                      <button
                        onClick={() => setMode(dyslexicOn ? "normal" : "dyslexic")}
                        aria-pressed={dyslexicOn}
                        className={`flex-1 h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 ${
                          dyslexicOn ? "bg-[#1BBC7E] text-white" : "bg-fill"
                        }`}
                      >
                        <BookOpen className="w-4 h-4" /> Dyslexic font
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
};

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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeModeContext";
import { ThemeMode } from "../types";

interface StudentShellProps {
  activeHash: string;
  onNavigate: (hash: string) => void;
  onOpenSearch: () => void;
  onOpenVoice: () => void;
  children: React.ReactNode;
}

type NavItem = { hash: string; label: string; icon: React.ElementType };

const SIDEBAR_ITEMS: NavItem[] = [
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

const MENU_GROUPS: { title: string; items: NavItem[] }[] = [
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

const MODE_OPTIONS: { id: ThemeMode; label: string; icon: React.ElementType }[] = [
  { id: "normal", label: "Standard", icon: Eye },
  { id: "adhd", label: "ADHD Focus", icon: Zap },
  { id: "dyslexic", label: "Dyslexic", icon: BookOpenCheck },
];

const isActive = (itemHash: string, activeHash: string) =>
  itemHash === "#student" ? activeHash === "#student" || activeHash === "#home" || activeHash === "" : itemHash === activeHash;

export const Avatar: React.FC<{ name: string; photoURL?: string; className?: string }> = ({ name, photoURL, className = "" }) =>
  photoURL ? (
    <img src={photoURL} alt="" className={`object-cover rounded-full ${className}`} />
  ) : (
    <span className={`rounded-full grid place-items-center bg-gradient-to-br from-[#B9A6FB] to-[#8266F0] text-white font-bold ${className}`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );

export const StudentShell: React.FC<StudentShellProps> = ({ activeHash, onNavigate, onOpenSearch, onOpenVoice, children }) => {
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
    <div className="min-h-screen bg-[#FBF9F7] text-[#1F2230]">
      {/* Sidebar */}
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 z-30 w-[76px] flex-col items-center rounded-[28px] bg-[#F7F2EC] py-5">
        <button onClick={() => onNavigate("#student")} aria-label="Eduvia dashboard" className="mb-6 rounded-2xl">
          <img src="/dashboard/logo.png" alt="" className="w-11 h-11 object-contain" />
        </button>
        <nav aria-label="Main" className="flex-1 flex flex-col items-center gap-2.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const active = isActive(item.hash, activeHash);
            return (
              <button
                key={item.hash}
                onClick={() => onNavigate(item.hash)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`group relative w-14 h-14 rounded-2xl grid place-items-center transition ${
                  active ? "bg-[#D4F5E9] text-[#0B8F5E]" : "text-[#3A3D4A] hover:bg-black/5"
                }`}
              >
                <item.icon className="w-6 h-6" strokeWidth={1.75} />
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-[#1F2230] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
        <button
          onClick={() => onNavigate("#settings")}
          aria-label="Profile settings"
          className="relative mt-4 rounded-full ring-2 ring-white"
        >
          <Avatar name={name} photoURL={user?.photoURL} className="w-11 h-11 text-sm" />
          <span className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-[#1BBC7E] ring-2 ring-[#F7F2EC]" aria-hidden="true" />
        </button>
      </aside>

      <div className="lg:pl-[108px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#FBF9F7]/90 backdrop-blur">
          <div ref={menusRef} className="relative flex items-center gap-3 px-4 sm:px-6 h-20">
            <button onClick={() => onNavigate("#student")} aria-label="Eduvia dashboard" className="lg:hidden shrink-0">
              <img src="/dashboard/logo.png" alt="" className="w-10 h-10 object-contain" />
            </button>

            <button
              onClick={onOpenSearch}
              className="flex-1 min-w-0 max-w-[470px] mx-auto h-12 rounded-full border border-black/10 bg-[#F6F3F0] hover:border-black/20 px-4 sm:px-5 flex items-center gap-3 text-left text-sm text-[#8A8C95] transition"
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
                className="hidden sm:flex h-12 px-4 lg:px-6 rounded-2xl bg-[#EEE8FD] hover:bg-[#E3DAFD] text-[#6B4FD8] items-center gap-2 text-sm font-semibold transition"
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
                  className="h-12 pl-1.5 pr-2 sm:pr-3 rounded-2xl bg-[#F4F1EE] hover:bg-[#EDE8E3] flex items-center gap-2.5 transition"
                >
                  <Avatar name={name} photoURL={user?.photoURL} className="w-9 h-9 text-sm" />
                  <ChevronDown className={`w-4 h-4 transition ${openMenu === "profile" ? "rotate-180" : ""}`} />
                </button>
                {openMenu === "profile" && (
                  <div role="menu" className="absolute right-0 top-full mt-2 w-72 rounded-3xl bg-white border border-black/5 shadow-2xl p-3 z-50">
                    <div className="flex items-center gap-3 p-2 pb-3 border-b border-black/5">
                      <Avatar name={name} photoURL={user?.photoURL} className="w-11 h-11 text-base" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{name}</div>
                        <div className="text-xs text-[#8A8C95] truncate">{user?.email}</div>
                      </div>
                    </div>
                    <div className="px-2 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#8A8C95]">Reading mode</div>
                    {MODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        role="menuitemradio"
                        aria-checked={mode === opt.id}
                        onClick={() => setMode(opt.id)}
                        className={`w-full px-3 py-2.5 rounded-2xl flex items-center gap-2.5 text-sm transition ${
                          mode === opt.id ? "bg-[#D4F5E9] font-bold" : "hover:bg-black/5"
                        }`}
                      >
                        <opt.icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{opt.label}</span>
                        {mode === opt.id && <Check className="w-4 h-4 text-[#0B8F5E]" />}
                      </button>
                    ))}
                    <div className="my-2 border-t border-black/5" />
                    <button
                      role="menuitem"
                      onClick={() => onNavigate("#settings")}
                      className="w-full px-3 py-2.5 rounded-2xl flex items-center gap-2.5 text-sm hover:bg-black/5"
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
                      className="w-full px-3 py-2.5 rounded-2xl flex items-center gap-2.5 text-sm text-rose-600 hover:bg-rose-50"
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
                  className="w-12 h-12 grid place-items-center rounded-2xl bg-[#F4F1EE] hover:bg-[#EDE8E3] transition"
                >
                  {openMenu === "pages" ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                {openMenu === "pages" && (
                  <div role="menu" className="absolute right-0 top-full mt-2 w-[min(92vw,560px)] rounded-3xl bg-white border border-black/5 shadow-2xl p-4 z-50 grid sm:grid-cols-3 gap-4">
                    {MENU_GROUPS.map((group) => (
                      <div key={group.title}>
                        <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#8A8C95]">{group.title}</div>
                        {group.items.map((item) => {
                          const active = isActive(item.hash, activeHash);
                          return (
                            <button
                              key={item.hash}
                              role="menuitem"
                              onClick={() => onNavigate(item.hash)}
                              aria-current={active ? "page" : undefined}
                              className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-sm text-left transition ${
                                active ? "bg-[#D4F5E9] font-bold text-[#0B6B47]" : "hover:bg-black/5"
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
                        className="flex-1 h-11 rounded-2xl bg-[#EEE8FD] text-[#6B4FD8] text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Mic className="w-4 h-4" /> Voice Coach
                      </button>
                      <button
                        onClick={() => setMode(dyslexicOn ? "normal" : "dyslexic")}
                        aria-pressed={dyslexicOn}
                        className={`flex-1 h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 ${
                          dyslexicOn ? "bg-[#1BBC7E] text-white" : "bg-[#F4F1EE]"
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

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutGrid,
  Laptop,
  SquarePlay,
  Briefcase,
  Box,
  BarChart3,
  Star,
  ChevronRight,
  ChevronLeft,
  Bell,
  Settings,
  UserRound,
  CalendarDays,
  Clock,
  Brain,
  Timer,
  Flame,
  ArrowRight,
  GraduationCap,
  CalendarClock,
  CheckCheck,
  Bot,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeModeContext";
import { dataService, DayActivity, WeeklyActivity } from "../services/dataService";
import { StudentMisconceptionRecord } from "../types";
import { Avatar } from "../components/StudentShell";

interface StudentDashboardProps {
  onNavigate: (hash: string) => void;
}

type Category = "practice" | "lessons" | "planning" | "explore" | "progress";
type TabId = "all" | Category | "starred";

interface PlanTask {
  id: string;
  title: string;
  duration: string;
  actionHash: string;
  completed: boolean;
}

interface DashItem {
  id: string;
  title: string;
  description: string;
  meta: string;
  hash: string;
  category: Category;
  bg: string;
  accent: string;
  art?: string;
  icon: React.ElementType;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "practice", label: "Practice", icon: Laptop },
  { id: "lessons", label: "Lessons", icon: SquarePlay },
  { id: "planning", label: "Planning", icon: Briefcase },
  { id: "explore", label: "Explore", icon: Box },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "starred", label: "Starred", icon: Star },
];

const CATEGORY_ICON: Record<Category, React.ElementType> = {
  practice: Laptop,
  lessons: SquarePlay,
  planning: Briefcase,
  explore: Box,
  progress: BarChart3,
};

// Softens the art's rectangular edges into the card's subtle background gradient.
const ART_FADE: React.CSSProperties = {
  WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 18%), linear-gradient(to bottom, transparent 0, #000 10%)",
  WebkitMaskComposite: "source-in",
  maskImage: "linear-gradient(to right, transparent 0, #000 18%), linear-gradient(to bottom, transparent 0, #000 10%)",
  maskComposite: "intersect",
};

const FEATURED = ["diagnostic", "plan", "library", "self-study"];
const SIDE_CARDS = ["courses", "mentors"];

const ACTIVITY_SEGMENTS: { key: keyof Omit<DayActivity, "day">; label: string; color: string }[] = [
  { key: "lessons", label: "Lessons", color: "#C9BFFA" },
  { key: "practice", label: "Practice", color: "#A6E6CF" },
  { key: "review", label: "Review", color: "#FDE3A0" },
  { key: "planning", label: "Planning", color: "#F9BCC8" },
];

const dayTotal = (d: DayActivity) => d.practice + d.lessons + d.review + d.planning;

const formatMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Smooth sparkline path (Catmull-Rom converted to cubic Béziers).
const sparkPath = (vals: number[], w = 96, h = 36) => {
  if (vals.length < 2) return "";
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const span = max - min || 1;
  const pts = vals.map((v, i) => [(i * w) / (vals.length - 1), h - 4 - ((v - min) / span) * (h - 8)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1} ${c2} ${p2}`;
  }
  return d;
};

const readList = (key: string): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { savedCourses, showToast } = useThemeMode();
  const uid = user?.uid ?? "guest";
  const firstName = (user?.displayName || "Learner").split(" ")[0];

  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [misconceptions, setMisconceptions] = useState<StudentMisconceptionRecord[]>([]);
  const [challengeCount, setChallengeCount] = useState<number | null>(null);
  const [resourceCount, setResourceCount] = useState<number | null>(null);
  const [activity, setActivity] = useState<WeeklyActivity | null>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<TabId>("all");
  const [week, setWeek] = useState<"thisWeek" | "lastWeek">("thisWeek");
  const [bellOpen, setBellOpen] = useState(false);

  const favoritesKey = `eduvia_dashboard_favorites_${uid}`;
  const readKey = `eduvia_read_notifications_${uid}`;
  const [favorites, setFavorites] = useState<string[]>(() => readList(favoritesKey));
  const favoritesRef = useRef(favorites);
  const [readNotifications, setReadNotifications] = useState<string[]>(() => readList(readKey));

  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabsAtEnd, setTabsAtEnd] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      dataService.getStudyPlan(),
      dataService.getStudentMisconceptions(user?.uid),
      dataService.getChallenges(),
      dataService.getResources(),
      dataService.getWeeklyActivity(uid),
    ]).then(([plan, logs, challenges, resources, weekly]) => {
      if (cancelled) return;
      setTasks(((plan as { todayTasks?: PlanTask[] })?.todayTasks) || []);
      setStreakDays(((plan as { streakDays?: number })?.streakDays) || 0);
      setMisconceptions(logs);
      setChallengeCount(challenges.length);
      setResourceCount(resources.length);
      setActivity(weekly);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, user?.uid]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    dataService
      .getDashboardFavorites(user.uid)
      .then((remote) => {
        if (cancelled) return;
        favoritesRef.current = remote;
        setFavorites(remote);
        localStorage.setItem(favoritesKey, JSON.stringify(remote));
      })
      .catch((err) => console.warn("[Dashboard] Could not load favourites; using local cache.", err));
    return () => {
      cancelled = true;
    };
  }, [user, favoritesKey]);

  useEffect(() => {
    if (!bellOpen) return;
    const onDown = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBellOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [bellOpen]);

  const doneTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.length - doneTasks;
  const nextTask = tasks.find((t) => !t.completed);
  const resolved = misconceptions.filter((m) => m.status === "Resolved").length;
  const active = misconceptions.length - resolved;

  const items: DashItem[] = useMemo(() => {
    const pending = (text: string) => (loading ? "Loading…" : text);
    return [
      {
        id: "diagnostic", title: "Diagnostic Challenge", category: "practice", hash: "#diagnostic",
        description: "Find the root cause behind a wrong answer in about 3 minutes.",
        meta: pending(challengeCount ? `${plural(challengeCount, "challenge")} ready` : "New challenges coming soon"),
        bg: "#FED8DE", accent: "#E4577A", art: "/dashboard/practice.png", icon: Laptop,
      },
      {
        id: "ai-tutor", title: "AI Tutor & Tests", category: "practice", hash: "#ai-tutor",
        description: "Chat with a tutor, then take a test on any topic you choose.",
        meta: "Pick a topic and difficulty",
        bg: "#E5E2FE", accent: "#6B4FD8", icon: Bot,
      },
      {
        id: "plan", title: "Today's Study Plan", category: "planning", hash: "#plan",
        description: "Short tasks picked around the gaps in your understanding.",
        meta: pending(tasks.length ? `${doneTasks} of ${plural(tasks.length, "task")} done` : "No tasks scheduled"),
        bg: "#FFF0D0", accent: "#D99A07", art: "/dashboard/planning.png", icon: Briefcase,
      },
      {
        id: "library", title: "Micro-Lesson Library", category: "lessons", hash: "#library",
        description: "Videos, simulations and readings matched to your misconceptions.",
        meta: pending(resourceCount ? `${plural(resourceCount, "resource")}` : "Search any topic"),
        bg: "#E5E2FE", accent: "#6B4FD8", art: "/dashboard/lessons.png", icon: SquarePlay,
      },
      {
        id: "self-study", title: "Self-Study Studio", category: "explore", hash: "#self-study",
        description: "Summarise your notes and practise at your own pace.",
        meta: "AI summaries & notes",
        bg: "#D7F7EB", accent: "#0B8F5E", art: "/dashboard/explore.png", icon: Box,
      },
      {
        id: "courses", title: "Saved Courses", category: "lessons", hash: "#courses",
        description: "Pick up the courses you bookmarked.",
        meta: savedCourses.length ? `${plural(savedCourses.length, "saved course")}` : "Bookmark courses to see them here",
        bg: "#FDD9DE", accent: "#E4577A", art: "/dashboard/courses.png", icon: Laptop,
      },
      {
        id: "mentors", title: "Mentor Sessions", category: "planning", hash: "#mentors",
        description: "Book 1-on-1 help from an instructor.",
        meta: "Browse instructors",
        bg: "#FDF0D1", accent: "#D99A07", icon: Briefcase,
      },
      {
        id: "misconceptions", title: "Misconception Tracker", category: "progress", hash: "#misconceptions",
        description: "See what's detected, being worked on and resolved.",
        meta: pending(misconceptions.length ? `${active} active · ${resolved} resolved` : "Nothing flagged yet"),
        bg: "#E5E2FE", accent: "#6B4FD8", icon: Brain,
      },
      {
        id: "paths", title: "Learning Paths", category: "explore", hash: "#paths",
        description: "Follow a guided, stage-by-stage progression.",
        meta: "5-stage paths",
        bg: "#D7F7EB", accent: "#0B8F5E", icon: GraduationCap,
      },
      {
        id: "report", title: "Diagnostic Report", category: "progress", hash: "#diagnostic-results",
        description: "Review your latest diagnostic results and mastery.",
        meta: "Latest results",
        bg: "#FED8DE", accent: "#E4577A", icon: BarChart3,
      },
      {
        id: "pacing", title: "Adaptive Pacing", category: "planning", hash: "#pacing",
        description: "Tune how quickly new material arrives.",
        meta: "Adjust your pace",
        bg: "#FFF0D0", accent: "#D99A07", icon: CalendarClock,
      },
    ];
  }, [loading, challengeCount, tasks.length, doneTasks, resourceCount, savedCourses.length, misconceptions.length, active, resolved]);

  const itemById = (id: string) => items.find((i) => i.id === id)!;

  const visibleItems = useMemo(() => {
    if (tab === "all") return FEATURED.map(itemById);
    if (tab === "starred") return favorites.map((id) => items.find((i) => i.id === id)).filter((i): i is DashItem => !!i);
    return items.filter((i) => i.category === tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, items, favorites]);

  const toggleFavorite = (item: DashItem) => {
    const prev = favoritesRef.current;
    const wasFav = prev.includes(item.id);
    const next = wasFav ? prev.filter((id) => id !== item.id) : [...prev, item.id];
    favoritesRef.current = next;
    setFavorites(next);
    localStorage.setItem(favoritesKey, JSON.stringify(next));
    if (!user) return;
    dataService
      .saveDashboardFavorites(user.uid, next)
      .then(() =>
        showToast(wasFav ? "Removed from Starred" : "Added to Starred", `"${item.title}" ${wasFav ? "was removed from" : "is now in"} your Starred tab.`, wasFav ? "info" : "success")
      )
      .catch((err) => {
        console.warn("[Dashboard] Failed to save favourites:", err);
        if (favoritesRef.current === next) {
          favoritesRef.current = prev;
          setFavorites(prev);
          localStorage.setItem(favoritesKey, JSON.stringify(prev));
        }
        showToast("Couldn't Save", "We couldn't reach the database. Please try again.", "warning");
      });
  };

  const updateTabsEnd = () => {
    const el = tabsRef.current;
    if (el) setTabsAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };
  useEffect(() => {
    updateTabsEnd();
    window.addEventListener("resize", updateTabsEnd);
    return () => window.removeEventListener("resize", updateTabsEnd);
  }, []);
  const scrollTabs = () => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollTo({ left: tabsAtEnd ? 0 : el.scrollLeft + el.clientWidth * 0.7, behavior: "smooth" });
  };

  const days = activity?.[week] ?? [];
  const weekTotals = days.map(dayTotal);
  const thisWeekTotals = (activity?.thisWeek ?? []).map(dayTotal);
  const maxDay = Math.max(1, ...weekTotals);
  const weekMinutes = weekTotals.reduce((a, b) => a + b, 0);
  const cumulative = thisWeekTotals.map((_, i) => thisWeekTotals.slice(0, i + 1).reduce((a, b) => a + b, 0));

  const notifications = useMemo(() => {
    const list: { id: string; text: string; hash: string }[] = [];
    const today = new Date().toISOString().slice(0, 10);
    if (pendingTasks > 0) list.push({ id: `tasks-${today}-${pendingTasks}`, text: `You have ${plural(pendingTasks, "study task")} left today.`, hash: "#plan" });
    if (active > 0) list.push({ id: `mis-${active}`, text: `${plural(active, "misconception")} need${active === 1 ? "s" : ""} review.`, hash: "#misconceptions" });
    if (challengeCount) list.push({ id: `challenges-${challengeCount}`, text: `${plural(challengeCount, "diagnostic challenge")} ready to try.`, hash: "#diagnostic" });
    if (savedCourses.length) list.push({ id: `courses-${savedCourses.length}`, text: `Continue one of your ${plural(savedCourses.length, "saved course")}.`, hash: "#courses" });
    if (streakDays > 0) list.push({ id: `streak-${today}`, text: `You're on a ${streakDays}-day streak. Keep it going!`, hash: "#plan" });
    return list;
  }, [pendingTasks, active, challengeCount, savedCourses.length, streakDays]);
  const unread = notifications.filter((n) => !readNotifications.includes(n.id));

  const markRead = (ids: string[]) => {
    const next = Array.from(new Set([...readNotifications, ...ids])).slice(-100);
    setReadNotifications(next);
    localStorage.setItem(readKey, JSON.stringify(next));
  };

  const stats = [
    { label: "Study streak", value: `${plural(streakDays, "day")}`, icon: BarChart3, color: "#1BBC7E", bg: "#E6F9F3", series: thisWeekTotals, hash: "#plan" },
    { label: "Time this week", value: formatMinutes(thisWeekTotals.reduce((a, b) => a + b, 0)), icon: Clock, color: "#F5B70A", bg: "#FFF8EC", series: cumulative, hash: "#pacing" },
    { label: "Misconceptions resolved", value: `${resolved}/${misconceptions.length}`, icon: Brain, color: "#8266F0", bg: "#EFEDFD", series: (activity?.thisWeek ?? []).map((d) => d.review), hash: "#misconceptions" },
    { label: "Today's tasks", value: `${doneTasks}/${tasks.length}`, icon: Timer, color: "#F0506E", bg: "#FEECF0", series: (activity?.thisWeek ?? []).map((d) => d.practice), hash: "#plan" },
  ];

  const renderCard = (item: DashItem, size: "large" | "compact" = "large") => {
    const fav = favorites.includes(item.id);
    const Icon = CATEGORY_ICON[item.category];
    const compact = size === "compact";
    return (
      <div
        key={item.id}
        className={`relative overflow-hidden rounded-[24px] ${compact ? "min-h-[92px]" : "min-h-[172px]"}`}
        style={{ backgroundColor: item.bg }}
      >
        <button
          onClick={() => onNavigate(item.hash)}
          aria-label={`Open ${item.title}`}
          className="absolute inset-0 z-0 rounded-[24px] transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#1F2230]/40"
        />
        <div className={`relative z-10 pointer-events-none flex ${compact ? "items-center gap-3 p-4 pr-16" : "flex-col p-5 max-w-[56%] sm:max-w-[50%]"}`}>
          <span className="w-11 h-11 shrink-0 rounded-full bg-white grid place-items-center shadow-sm text-[#1F2230]">
            <Icon className="w-5 h-5" strokeWidth={1.9} />
          </span>
          <div className={compact ? "min-w-0" : "mt-4"}>
            <h3 className="font-bold text-[16px] leading-snug text-[#1F2230]">{item.title}</h3>
            {!compact && <p className="mt-1 text-[13px] leading-snug text-[#4B4E5C]">{item.description}</p>}
            <p className={`${compact ? "mt-0.5" : "mt-3"} text-xs font-semibold`} style={{ color: item.accent }}>
              {item.meta}
            </p>
          </div>
        </div>
        {!compact &&
          (item.art ? (
            <img
              src={item.art}
              alt=""
              aria-hidden="true"
              className="absolute right-0 bottom-0 h-[150px] sm:h-[172px] w-auto max-w-[48%] sm:max-w-[52%] object-contain object-right-bottom pointer-events-none select-none"
              style={ART_FADE}
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute right-8 bottom-6 w-[30%] max-w-[130px] aspect-square rounded-full bg-white/70 grid place-items-center pointer-events-none"
            >
              <item.icon className="w-1/2 h-1/2" strokeWidth={1.4} style={{ color: item.accent }} />
            </div>
          ))}
        <button
          onClick={() => toggleFavorite(item)}
          aria-pressed={fav}
          aria-label={fav ? `Unstar ${item.title}` : `Star ${item.title}`}
          className={`absolute z-20 right-4 ${compact ? "top-1/2 -translate-y-1/2" : "top-4"} w-10 h-10 rounded-full bg-white grid place-items-center shadow-sm hover:scale-105 transition`}
        >
          <Star className={`w-5 h-5 ${fav ? "fill-[#F5B70A] text-[#F5B70A]" : "text-[#B8BAC2]"}`} />
        </button>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6 pb-12 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
      {/* ================= Main column ================= */}
      <div className="min-w-0 space-y-6">
        {/* Hero */}
        <section aria-labelledby="dash-heading" className="relative overflow-hidden rounded-[28px] bg-[#F8F2ED] md:min-h-[300px]">
          <div className="relative z-10 p-6 sm:p-9 md:max-w-[52%]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5D9FD] px-4 py-1.5 text-xs font-bold text-[#5B3FD0]">
              <Flame className="w-3.5 h-3.5" />
              {loading ? "Loading your streak…" : streakDays > 0 ? `${streakDays}-day learning streak` : "Start your streak today"}
            </span>
            <h1 id="dash-heading" className="mt-4 font-display font-extrabold text-[30px] sm:text-[36px] leading-tight text-[#1F2230]">
              Welcome back, {firstName}!
            </h1>
            <p className="relative inline-block mt-1 font-display font-extrabold text-[26px] sm:text-[32px] leading-tight text-[#02AE76]">
              Ready to learn today?
              <svg aria-hidden="true" viewBox="0 0 300 12" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 w-[92%] h-2.5">
                <path d="M3 9 Q 150 2 297 6" fill="none" stroke="#FEDB4A" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </p>
            <p className="mt-5 text-sm text-[#5B5E6B] leading-relaxed">
              {loading
                ? "Checking today's plan…"
                : nextTask
                ? <>Up next: <strong className="text-[#1F2230]">{nextTask.title}</strong> · {nextTask.duration}</>
                : "You've finished today's tasks. Try a diagnostic challenge to keep sharp."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate(nextTask?.actionHash || "#diagnostic")}
                className="h-11 px-5 rounded-full bg-[#0B0E13] text-white text-sm font-bold flex items-center gap-2 shadow-[0_3px_0_#1BBC7E] hover:bg-[#1BBC7E] hover:text-[#0B0E13] transition"
              >
                {nextTask ? "Continue learning" : "Start a challenge"}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate("#plan")}
                className="h-11 px-5 rounded-full border-[1.5px] border-[#1F2230]/20 hover:border-[#1F2230] text-sm font-semibold text-[#1F2230] transition"
              >
                View study plan
              </button>
            </div>
          </div>
          <img
            src="/dashboard/hero.png"
            alt="Student smiling at a laptop beside a stack of books"
            className="w-full md:absolute md:right-0 md:bottom-0 md:w-auto md:h-[300px] md:max-w-[50%] object-contain object-right-bottom"
          />
        </section>

        {/* Category tabs */}
        <div className="flex items-center gap-3">
          <div
            ref={tabsRef}
            onScroll={updateTabsEnd}
            role="tablist"
            aria-label="Filter activities"
            className="flex-1 min-w-0 flex gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1"
          >
            {TABS.map((t) => {
              const selected = tab === t.id;
              const count = t.id === "starred" ? favorites.length : null;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={selected}
                  aria-controls="dash-activities"
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 h-14 rounded-full flex items-center gap-3 pl-2 pr-6 text-sm font-semibold transition ${
                    selected ? "bg-[#0B0E13] text-white" : "bg-[#F4EDE7] text-[#1F2230] hover:bg-[#EDE4DC]"
                  }`}
                >
                  <span className={`w-10 h-10 rounded-full grid place-items-center ${selected ? "" : "bg-white shadow-sm"}`}>
                    <t.icon className="w-5 h-5" strokeWidth={2} />
                  </span>
                  {t.label}
                  {count !== null && count > 0 && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${selected ? "bg-white/20" : "bg-white"}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={scrollTabs}
            aria-label={tabsAtEnd ? "Scroll tabs back to start" : "Show more tabs"}
            className="shrink-0 w-14 h-14 rounded-full bg-[#F4EDE7] hover:bg-[#EDE4DC] grid place-items-center transition"
          >
            {tabsAtEnd ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Activity cards */}
        <div id="dash-activities" role="tabpanel" className="grid gap-4 md:grid-cols-2">
          {visibleItems.length > 0 ? (
            visibleItems.map((item) => renderCard(item))
          ) : (
            <div className="md:col-span-2 rounded-[24px] border-2 border-dashed border-black/10 p-10 text-center">
              <Star className="w-8 h-8 mx-auto text-[#F5B70A]" />
              <p className="mt-3 font-bold text-[#1F2230]">Nothing starred yet</p>
              <p className="mt-1 text-sm text-[#5B5E6B]">Tap the star on any card to keep it here for quick access.</p>
            </div>
          )}
        </div>

        {/* Stat tiles */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4">
          {stats.map((s) => (
            <button
              key={s.label}
              onClick={() => onNavigate(s.hash)}
              className="rounded-[22px] p-4 flex items-center gap-3 text-left hover:brightness-[0.98] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1F2230]/20"
              style={{ backgroundColor: s.bg }}
            >
              <s.icon className="w-8 h-8 shrink-0" style={{ color: s.color }} strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <div className="text-xs leading-tight text-[#5B5E6B]">{s.label}</div>
                <div className="text-lg font-extrabold text-[#1F2230]">{loading ? "…" : s.value}</div>
              </div>
              <svg aria-hidden="true" viewBox="0 0 96 36" className="w-20 h-9 shrink-0">
                <path d={sparkPath(s.series)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* ================= Right column ================= */}
      <aside className="space-y-5" aria-label="Your profile and activity">
        {/* Profile */}
        <section className="rounded-[28px] bg-[#F6EFE9] p-5">
          <div className="flex items-start justify-between">
            <div ref={bellRef} className="relative">
              <button
                onClick={() => setBellOpen((o) => !o)}
                aria-haspopup="dialog"
                aria-expanded={bellOpen}
                aria-label={`Notifications${unread.length ? ` (${unread.length} unread)` : ""}`}
                className="relative w-11 h-11 grid place-items-center rounded-full hover:bg-black/5 transition"
              >
                <Bell className="w-6 h-6 text-[#1F2230]" strokeWidth={1.75} />
                {unread.length > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F0506E] text-white text-[10px] font-bold grid place-items-center">
                    {unread.length}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div role="dialog" aria-label="Notifications" className="absolute left-0 top-full mt-2 w-[min(84vw,320px)] rounded-3xl bg-white border border-black/5 shadow-2xl p-3 z-40">
                  <div className="flex items-center justify-between px-2 pb-2">
                    <span className="text-sm font-bold">Notifications</span>
                    {unread.length > 0 && (
                      <button onClick={() => markRead(notifications.map((n) => n.id))} className="text-xs font-semibold text-[#6B4FD8] flex items-center gap-1 hover:underline">
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-2 py-4 text-sm text-[#5B5E6B]">You're all caught up.</p>
                  ) : (
                    notifications.map((n) => {
                      const isUnread = !readNotifications.includes(n.id);
                      return (
                        <button
                          key={n.id}
                          onClick={() => {
                            markRead([n.id]);
                            setBellOpen(false);
                            onNavigate(n.hash);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-black/5 flex items-start gap-2.5 text-sm"
                        >
                          <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isUnread ? "bg-[#F0506E]" : "bg-transparent"}`} />
                          <span className={isUnread ? "font-semibold text-[#1F2230]" : "text-[#5B5E6B]"}>{n.text}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <button onClick={() => onNavigate("#settings")} aria-label="Settings" className="w-11 h-11 grid place-items-center rounded-full hover:bg-black/5 transition">
              <Settings className="w-6 h-6 text-[#1F2230]" strokeWidth={1.75} />
            </button>
          </div>
          <div className="-mt-4 flex flex-col items-center text-center">
            <div className="p-1.5 rounded-full bg-gradient-to-br from-[#D8CCFD] to-[#B9A6FB]">
              <Avatar name={firstName} photoURL={user?.photoURL} className="w-24 h-24 text-3xl" />
            </div>
            <h2 className="mt-3 text-lg font-bold text-[#1F2230]">{user?.displayName || "Learner"}</h2>
            <p className="text-xs text-[#5B5E6B]">{user?.institution || user?.email}</p>
          </div>
          <button
            onClick={() => onNavigate("#mentors")}
            className="mt-5 w-full rounded-[20px] bg-white px-3 py-3 flex items-center gap-3 hover:shadow-md transition"
          >
            <span className="w-10 h-10 rounded-full bg-[#EEE8FD] grid place-items-center text-[#5B3FD0]">
              <UserRound className="w-5 h-5" />
            </span>
            <span className="flex-1 text-left text-sm font-semibold text-[#1F2230]">My mentors</span>
            <span className="flex -space-x-2" aria-hidden="true">
              <span className="w-7 h-7 rounded-full bg-[#D8CCFD] ring-2 ring-white" />
              <span className="w-7 h-7 rounded-full bg-[#FDE9B0] ring-2 ring-white" />
              <span className="w-7 h-7 rounded-full bg-[#F9B4BF] ring-2 ring-white" />
            </span>
            <ChevronRight className="w-5 h-5 text-[#1F2230]" />
          </button>
        </section>

        {/* Weekly activity */}
        <section aria-labelledby="activity-heading" className="rounded-[28px] bg-white border border-black/5 p-5">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-[#EEE8FD] grid place-items-center text-[#6B4FD8]">
              <CalendarDays className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 id="activity-heading" className="text-sm font-bold text-[#1F2230]">Weekly activity</h2>
              <p className="text-xs text-[#5B5E6B]">{activity ? `${formatMinutes(weekMinutes)} studied` : "Loading…"}</p>
            </div>
            <label className="sr-only" htmlFor="activity-week">Week</label>
            <select
              id="activity-week"
              value={week}
              onChange={(e) => setWeek(e.target.value as "thisWeek" | "lastWeek")}
              className="h-10 rounded-full border border-black/10 bg-white pl-3 pr-8 text-xs font-semibold text-[#1F2230] focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
            >
              <option value="thisWeek">This week</option>
              <option value="lastWeek">Last week</option>
            </select>
          </div>
          {activity?.isSample && (
            <p className="mt-3 text-[11px] font-semibold text-[#8A6A00] bg-[#FFF4D6] rounded-full px-3 py-1 inline-block">
              Sample data. Activity tracking starts once you study.
            </p>
          )}
          <div className="mt-4 h-[150px] flex items-end justify-between gap-2" role="img" aria-label={`Minutes studied per day: ${days.map((d) => `${d.day} ${dayTotal(d)}`).join(", ")}`}>
            {days.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end" title={`${d.day}: ${formatMinutes(dayTotal(d))}`}>
                <div
                  className="w-full max-w-[30px] rounded-xl overflow-hidden flex flex-col-reverse transition-all duration-300"
                  style={{ height: `${Math.max(6, (dayTotal(d) / maxDay) * 118)}px` }}
                >
                  {ACTIVITY_SEGMENTS.map((seg) => (
                    <div key={seg.key} style={{ flexGrow: d[seg.key], backgroundColor: seg.color }} />
                  ))}
                </div>
                <span className="text-[10px] font-semibold text-[#8A8C95]">{d.day.slice(0, 2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {ACTIVITY_SEGMENTS.map((seg) => (
              <span key={seg.key} className="flex items-center gap-1.5 text-[11px] text-[#5B5E6B]">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                {seg.label}
              </span>
            ))}
          </div>
        </section>

        {/* Side cards */}
        {renderCard(itemById(SIDE_CARDS[0]))}
        {renderCard(itemById(SIDE_CARDS[1]), "compact")}
      </aside>
    </div>
  );
};

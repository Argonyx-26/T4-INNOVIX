import React, { useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  GraduationCap, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  ChevronRight, 
  Layers, 
  Compass, 
  PlayCircle, 
  TrendingUp, 
  ShieldCheck, 
  ExternalLink,
  Target
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { MOCK_STUDENT_MISCONCEPTION_LOGS } from "../data/mockStudentTelemetry";
import { MOCK_COURSES } from "../data/mockCourses";

interface StudentDashboardProps {
  onNavigate: (hash: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("Computer Science");

  const displayName = user?.displayName || "Alex Chen";
  const userTier = user?.academicTier || "Undergraduate (UG)";

  // Misconception status counts
  const detectedCount = MOCK_STUDENT_MISCONCEPTION_LOGS.filter(m => m.status === "Detected").length;
  const remediatingCount = MOCK_STUDENT_MISCONCEPTION_LOGS.filter(m => m.status === "Remediating").length;
  const reevaluatingCount = MOCK_STUDENT_MISCONCEPTION_LOGS.filter(m => m.status === "Re-Evaluating").length;
  const resolvedCount = MOCK_STUDENT_MISCONCEPTION_LOGS.filter(m => m.status === "Resolved").length;

  const currentCourse = MOCK_COURSES[0]; // DSA

  return (
    <div className="min-h-screen py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header & Greeting Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#8266F0]/10 text-[#8266F0] dark:bg-[#8266F0]/20 font-bold text-xs tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Student Cognitive Command Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            Here is your daily cognitive diagnosis. Today's goal: trace and clear the boundary off-by-one error in binary search.
          </p>
        </div>

        {/* Academic Tier Badge & Discipline Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10 flex items-center space-x-1.5">
            <GraduationCap className="w-4 h-4 text-[#8266F0]" />
            <span>{userTier}</span>
          </span>

          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#1E1E24] border border-black/10 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
          >
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Medicine & Physiology">Medicine & Physiology</option>
            <option value="Commerce & Finance">Commerce & Finance</option>
          </select>
        </div>
      </div>

      {/* 2. Today's Recommended Action (Primary Focus Card) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#141414] via-[#1E1E24] to-[#251E3E] text-white p-6 sm:p-8 border border-white/10 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#8266F0]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Priority Diagnostic • Est. 3 Minutes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
              Binary Search Boundary Interval & Off-by-One Loop Traps
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Diagnostic identified: You assign <code className="bg-white/15 px-1.5 py-0.5 rounded text-amber-300 font-mono text-xs">high = mid</code> instead of <code className="bg-white/15 px-1.5 py-0.5 rounded text-emerald-300 font-mono text-xs">high = mid - 1</code> in 2-element arrays. Run a quick micro-intervention now to stabilize concept retention.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => onNavigate("#diagnostic")}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#8266F0] to-[#EC4899] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#8266F0]/30 transition flex items-center justify-center space-x-2"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Start Diagnostic Challenge</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate("#misconceptions")}
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition border border-white/10 flex items-center justify-center space-x-2"
            >
              <span>View Misconception Radar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Cognitive Velocity & Mastery Metrics Snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold">Overall Mastery</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-display">84%</div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>+14% this week</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold">Cognitive Velocity</span>
            <Clock className="w-4 h-4 text-[#8266F0]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-display">38s</div>
          <div className="text-[11px] text-neutral-500 font-medium">Avg problem completion</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold">Hint Reliance</span>
            <ShieldCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-display">0.28</div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Low (High Independence)</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-xs font-semibold">Time Saved</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-display">4.2h</div>
          <div className="text-[11px] text-neutral-500 font-medium">Targeted micro-remediation</div>
        </div>
      </div>

      {/* 4. Active Misconception Status Hub */}
      <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-white">
                Cognitive Misconception Radar
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                Live State
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Eduvia tracks your mental models across 4 distinct lifecycle stages.
            </p>
          </div>

          <button
            onClick={() => onNavigate("#misconceptions")}
            className="text-xs font-bold text-[#8266F0] hover:text-[#7054df] transition flex items-center space-x-1"
          >
            <span>Open Misconception Center</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div 
            onClick={() => onNavigate("#misconceptions")}
            className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 cursor-pointer hover:bg-rose-500/10 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Detected</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{detectedCount}</div>
            <span className="text-[10px] text-neutral-500">Needs immediate review</span>
          </div>

          <div 
            onClick={() => onNavigate("#misconceptions")}
            className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 cursor-pointer hover:bg-amber-500/10 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Remediating</span>
              <Activity className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{remediatingCount}</div>
            <span className="text-[10px] text-neutral-500">In 3-tier scaffolding</span>
          </div>

          <div 
            onClick={() => onNavigate("#misconceptions")}
            className="p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/20 cursor-pointer hover:bg-sky-500/10 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Re-evaluating</span>
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{reevaluatingCount}</div>
            <span className="text-[10px] text-neutral-500">Transfer question queued</span>
          </div>

          <div 
            onClick={() => onNavigate("#misconceptions")}
            className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/10 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Resolved</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-1">{resolvedCount}</div>
            <span className="text-[10px] text-neutral-500">Verified stable model</span>
          </div>
        </div>

        {/* Active Misconception Item preview */}
        <div className="space-y-3 pt-2">
          {MOCK_STUDENT_MISCONCEPTION_LOGS.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#8266F0]/40 transition"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    item.status === "Detected" ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" :
                    item.status === "Remediating" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                    item.status === "Re-Evaluating" ? "bg-sky-500/15 text-sky-600 dark:text-sky-400" :
                    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">{item.discipline}</span>
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {item.identifiedMisconception}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  Remediation: {item.remedialInterventionTitle}
                </p>
              </div>

              <button
                onClick={() => onNavigate("#misconceptions")}
                className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold text-[#8266F0] bg-[#8266F0]/10 hover:bg-[#8266F0]/20 transition flex items-center justify-center space-x-1"
              >
                <span>Drill Down</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Continue Learning & Enrolled Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Continue Current Course */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-display text-neutral-900 dark:text-white">
                Continue Learning
              </h3>
              <p className="text-xs text-neutral-500">Pick up right where you left off</p>
            </div>
            <button
              onClick={() => onNavigate("#courses")}
              className="text-xs font-bold text-[#8266F0] hover:underline"
            >
              Browse all courses
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#8266F0]/10 text-[#8266F0]">
                  {currentCourse.category}
                </span>
                <span className="text-xs text-neutral-500">{currentCourse.discipline}</span>
              </div>
              <h4 className="text-base font-bold text-neutral-900 dark:text-white">
                {currentCourse.title}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md">
                Current Module: Module 2: Search Invariants & Pointer Bounds
              </p>
              
              {/* Progress bar */}
              <div className="w-full max-w-sm pt-1 space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-neutral-500">
                  <span>Progress</span>
                  <span className="text-[#8266F0]">68%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#8266F0] to-[#EC4899] rounded-full" style={{ width: "68%" }} />
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("#courses")}
              className="shrink-0 px-5 py-3 rounded-2xl bg-[#141414] dark:bg-white text-white dark:text-[#141414] hover:opacity-90 font-bold text-xs shadow transition flex items-center space-x-1.5"
            >
              <span>Resume Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Learning Path Track */}
          <div 
            onClick={() => onNavigate("#paths")}
            className="p-4 rounded-2xl bg-gradient-to-r from-[#8266F0]/10 to-[#EC4899]/10 border border-[#8266F0]/20 flex items-center justify-between cursor-pointer hover:border-[#8266F0]/40 transition"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#8266F0] text-white flex items-center justify-center font-bold text-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-neutral-900 dark:text-white">
                  Active Learning Path: Algorithmic Rigor & Correctness
                </h5>
                <p className="text-[11px] text-neutral-500">Stage 3 of 5 • Boundary & Edge Case Diagnosis</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8266F0]" />
          </div>
        </div>

        {/* Recommended Resources Column */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display text-neutral-900 dark:text-white">
              Curated Resources
            </h3>
            <button
              onClick={() => onNavigate("#library")}
              className="text-xs font-bold text-[#8266F0] hover:underline"
            >
              View all
            </button>
          </div>

          <p className="text-xs text-neutral-500">
            Targeted materials based on your active misconception hurdles.
          </p>

          <div className="space-y-3">
            <a
              href="https://visualgo.net/en/bst"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-[#8266F0]/10 border border-black/5 dark:border-white/10 flex items-start justify-between transition group"
            >
              <div className="space-y-1 pr-2">
                <span className="text-[10px] font-bold uppercase text-[#8266F0]">Interactive Simulation</span>
                <h5 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-[#8266F0] transition line-clamp-1">
                  VisuAlgo: Binary Search Invariants
                </h5>
                <p className="text-[11px] text-neutral-400">VisuAlgo • 10 mins</p>
              </div>
              <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-[#8266F0] shrink-0 mt-1" />
            </a>

            <a
              href="https://ocw.mit.edu"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-[#8266F0]/10 border border-black/5 dark:border-white/10 flex items-start justify-between transition group"
            >
              <div className="space-y-1 pr-2">
                <span className="text-[10px] font-bold uppercase text-rose-500">Lecture Cheatsheet</span>
                <h5 className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-[#8266F0] transition line-clamp-1">
                  MIT 6.006: Loop Invariant Proofs
                </h5>
                <p className="text-[11px] text-neutral-400">MIT OpenCourseWare • 4 pages</p>
              </div>
              <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-[#8266F0] shrink-0 mt-1" />
            </a>

            <div 
              onClick={() => onNavigate("#plan")}
              className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-[#8266F0]/10 border border-black/5 dark:border-white/10 flex items-center justify-between cursor-pointer transition"
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#8266F0]" />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Open My Study Plan
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

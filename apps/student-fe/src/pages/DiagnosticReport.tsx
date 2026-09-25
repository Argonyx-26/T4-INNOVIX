import React from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  BookOpen, 
  ExternalLink, 
  FileText, 
  Compass, 
  Share2, 
  Printer,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface DiagnosticReportProps {
  onNavigate: (hash: string) => void;
}

export const DiagnosticReport: React.FC<DiagnosticReportProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const displayName = user?.displayName || "Alex Chen";

  return (
    <div className="min-h-screen py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Report Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs tracking-wider uppercase mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Diagnostic Assessment Complete • Report ID: LL-2026-DIAG-09</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            Cognitive Diagnostic Report
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Learner: <span className="font-bold text-neutral-800 dark:text-neutral-200">{displayName}</span> • Academic Tier: Undergraduate (UG) • Discipline: Computer Science
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 transition text-xs font-semibold flex items-center space-x-1.5"
            title="Print or Save PDF"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => onNavigate("#diagnostic")}
            className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 hover:bg-black/10 transition text-xs font-bold flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retest Challenge</span>
          </button>
        </div>
      </div>

      {/* 1. Overall Mastery Score Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#141414] via-[#1E1E24] to-[#251E3E] text-white p-6 sm:p-8 border border-white/10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Bayesian Mastery Recalculation
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
            Concept Mastery: 88% (Proficient)
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-xl">
            You successfully diagnosed and resolved the boundary trap! Your mental model for loop invariant shrinkage now conforms to the verified formal specification.
          </p>
        </div>

        <div className="shrink-0 flex items-center space-x-4">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex flex-col items-center justify-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-display">88%</span>
            <span className="text-[10px] font-bold text-emerald-300 uppercase">+34% Delta</span>
          </div>
        </div>
      </div>

      {/* 2. Cognitive Velocity & Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-xs text-neutral-500 font-semibold">Total Time</span>
          <div className="text-xl font-bold text-neutral-900 dark:text-white font-display">58s</div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Fast Cognitive Velocity</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-xs text-neutral-500 font-semibold">Hints Utilized</span>
          <div className="text-xl font-bold text-[#8266F0] font-display">1 of 3</div>
          <span className="text-[10px] text-neutral-400">Nudge Tier 1 only</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-xs text-neutral-500 font-semibold">Transfer Verification</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-display">Cleared ✓</div>
          <span className="text-[10px] text-emerald-600 font-bold">Attempt 1</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
          <span className="text-xs text-neutral-500 font-semibold">Misconception Risk</span>
          <div className="text-xl font-bold text-sky-500 font-display">Low (12%)</div>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">Stable Model</span>
        </div>
      </div>

      {/* 3. Cognitive Path Analysis (Root Cause Diagnosis) */}
      <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-white">
            Cognitive Path Analysis
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Detailed breakdown of flawed thinking vs. verified correct reasoning.
          </p>
        </div>

        <div className="space-y-4">
          {/* Initial Trap Selected */}
          <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 space-y-2">
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Initial Roadblock: Distractor B Selected</span>
            </div>
            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-mono">
              Trap: Assigned `high = mid` during subproblem reduction.
            </p>
            <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
              <span className="font-bold">Root Cause Diagnosis:</span> The search space invariant required strict monotonic reduction. By keeping `mid` inside `[low, high]`, an infinite loop is triggered whenever `high - low == 1` and target is smaller.
            </p>
          </div>

          {/* Correct Path */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolved Pathway: Invariant Shrinkage</span>
            </div>
            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-mono">
              Correction: Assign `high = mid - 1` because `arr[mid]` has already been explicitly compared and discarded.
            </p>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <span className="font-bold">Mental Model Stabilized:</span> In discrete pointer spaces, every step must guarantee `high_next - low_next &lt; high_curr - low_curr`.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Concepts Resolved & Prerequisites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">
            <CheckCircle2 className="w-4 h-4" />
            <span>Concepts Cleared In This Assessment</span>
          </div>
          <ul className="space-y-2 text-xs text-neutral-700 dark:text-neutral-300">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Binary Search inclusive interval boundary condition</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Loop termination proof for 2-element arrays</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Strict monotonic decrease of search space length</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-[#8266F0] text-xs font-bold uppercase">
            <BookOpen className="w-4 h-4" />
            <span>Recommended Next Focus</span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            Now that boundary invariants are clear, proceed to pointer aliasing in linked chains or logarithmic complexity bounds.
          </p>
          <div className="pt-1">
            <button
              onClick={() => onNavigate("#pacing")}
              className="text-xs font-bold text-[#8266F0] hover:underline flex items-center space-x-1"
            >
              <span>Explore in Adaptive Learning</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Action Buttons & Next Steps */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => onNavigate("#misconceptions")}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs bg-black/5 dark:bg-white/10 hover:bg-black/10 text-neutral-800 dark:text-white transition flex items-center justify-center space-x-2"
        >
          <span>Review All Misconceptions</span>
        </button>

        <button
          onClick={() => onNavigate("#pacing")}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-[#8266F0] to-[#EC4899] text-white hover:opacity-95 shadow-lg shadow-[#8266F0]/25 transition flex items-center justify-center space-x-2"
        >
          <span>Continue Adaptive Learning Journey</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

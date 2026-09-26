import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  ArrowRight, 
  Clock, 
  Layers, 
  ExternalLink, 
  RotateCcw, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Lightbulb, 
  ShieldCheck, 
  X,
  Target,
  Loader2
} from "lucide-react";
import { dataService } from "../services/dataService";
import { useAuth } from "../context/AuthContext";
import { PENDING_CHALLENGE_KEY } from "./LearnLensDiagnostic";
import { PENDING_PRACTICE_KEY } from "./AITutor";
import { AiMisconceptionRecord } from "../services/dataService";
import { RESOLVE_STREAK, slugKey } from "../services/learningService";
import { StudentMisconceptionRecord, MisconceptionStatus } from "../types";

interface MisconceptionCenterProps {
  onNavigate: (hash: string) => void;
}

export const MisconceptionCenter: React.FC<MisconceptionCenterProps> = ({ onNavigate }) => {
  const [misconceptions, setMisconceptions] = useState<StudentMisconceptionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"All" | MisconceptionStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All");
  const [selectedRecord, setSelectedRecord] = useState<StudentMisconceptionRecord | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    dataService.getStudentMisconceptions(user?.uid).then((data) => {
      setMisconceptions(data);
      setLoading(false);
    });
  }, [user?.uid]);

  // AI-detected misconceptions get targeted open-ended practice; question-bank ones re-run their diagnostic loop.
  const practice = (record: StudentMisconceptionRecord) => {
    const ai = record as Partial<AiMisconceptionRecord>;
    const fromAi = record.conceptId.startsWith("ai:");
    try {
      if (fromAi) {
        sessionStorage.setItem(
          PENDING_PRACTICE_KEY,
          JSON.stringify({
            subject: record.discipline,
            topic: record.conceptName,
            focus: {
              recordId: record.id,
              ref: {
                key: ai.misconceptionKey || slugKey(record.identifiedMisconception),
                title: record.identifiedMisconception,
                explanation: ai.explanation || "",
              },
            },
          })
        );
      } else sessionStorage.setItem(PENDING_CHALLENGE_KEY, record.conceptId);
    } catch {
      /* storage unavailable: the target page opens on its default state */
    }
    onNavigate(fromAi ? "#ai-tutor" : "#diagnostic");
  };

  // Filter items
  const filteredRecords = misconceptions.filter((item) => {
    const matchesTab = activeTab === "All" || item.status === activeTab;
    const matchesSearch = 
      item.conceptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.identifiedMisconception.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiscipline = selectedDiscipline === "All" || item.discipline === selectedDiscipline;
    return matchesTab && matchesSearch && matchesDiscipline;
  });

  const getStatusColor = (status: MisconceptionStatus) => {
    switch (status) {
      case "Detected":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "Remediating":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Re-Evaluating":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
      case "Resolved":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand/10 text-brand dark:bg-brand/20 font-bold text-xs tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Eduvia Cognitive Architecture Signature Feature</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            Misconception Command Center
          </h1>
          <p className="adhd-hide text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            "Don't just detect the wrong answer. Diagnose the wrong thinking." Track your mental models as they evolve from initial detection to verified mastery.
          </p>
        </div>

        <button
          onClick={() => onNavigate("#diagnostic")}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand to-[#EC4899] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-brand/25 transition flex items-center space-x-2 shrink-0"
        >
          <Target className="w-4 h-4" />
          <span>Launch AI Diagnostic</span>
        </button>
      </div>

      {/* Lifecycle Flow Tracker Pill Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Cognitive Lifecycle State:
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>01 Detected</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>02 Remediating</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/20 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>03 Re-Evaluating</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 shrink-0 text-neutral-400" aria-hidden="true" />
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>04 Resolved</span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* State Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(["All", "Detected", "Remediating", "Re-Evaluating", "Resolved"] as const).map((tab) => {
            const count = tab === "All" 
              ? misconceptions.length 
              : misconceptions.filter(m => m.status === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-[#141414] dark:bg-white text-white dark:text-[#141414] shadow"
                    : "bg-white dark:bg-[#1E1E24] text-neutral-600 dark:text-neutral-300 border border-black/5 dark:border-white/10 hover:bg-black/5"
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-white/20 dark:bg-black/20" : "bg-black/10 dark:bg-white/10"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Discipline Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search concepts or traps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#1E1E24] border border-black/10 dark:border-white/10 text-xs text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand w-48 sm:w-60"
            />
          </div>

          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#1E1E24] border border-black/10 dark:border-white/10 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="All">All Disciplines</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Medicine & Physiology">Medicine & Physiology</option>
            <option value="Commerce & Finance">Commerce & Finance</option>
            <option value="Natural Sciences">Natural Sciences</option>
            <option value="Law & Humanities">Law & Humanities</option>
          </select>
        </div>
      </div>

      {/* Misconception Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRecords.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 shadow-sm hover:border-brand/40 transition space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                <span className="text-xs font-semibold text-neutral-400">{item.discipline}</span>
              </div>

              <div>
                <h3 className="text-lg font-bold font-display text-neutral-900 dark:text-white">
                  {item.conceptName}
                </h3>
                <div className="mt-1.5 p-3 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 text-xs text-rose-800 dark:text-rose-300 font-medium">
                  <span className="font-bold">Mental Model Trap:</span> {item.identifiedMisconception}
                </div>
              </div>

              <div className="adhd-hide p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-brand">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Remedial Intervention</span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-snug">
                  {item.remedialInterventionTitle}
                </p>
              </div>

              <div className="adhd-hide flex items-center justify-between text-[11px] text-neutral-400 font-medium pt-1">
                <span>First detected: {item.firstDetected}</span>
                <span>Attempts: {item.attemptCount}</span>
              </div>
              {item.status !== "Resolved" && ((item as Partial<AiMisconceptionRecord>).practiceStreak || 0) > 0 && (
                <div className="text-[11px] font-bold text-emerald-600">
                  {(item as Partial<AiMisconceptionRecord>).practiceStreak}/{RESOLVE_STREAK} correct in a row: nearly resolved
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedRecord(item)}
                className="text-xs font-bold text-brand hover:underline flex items-center space-x-1"
              >
                <span>Cognitive Analysis & Detail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => practice(item)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#141414] dark:bg-white text-white dark:text-[#141414] hover:opacity-90 shadow-sm transition flex items-center space-x-1.5"
              >
                <span>{item.status === "Resolved" ? "Verify Retention" : item.conceptId.startsWith("ai:") ? "Targeted Practice" : "Practice Challenge"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#1E1E24] rounded-3xl border border-black/5 dark:border-white/10 p-8 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            No Misconceptions Found
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            You have no active cognitive roadblocks matching your filter. Keep testing to discover any subtle edge-case gaps!
          </p>
        </div>
      )}

      {/* Misconception Detail Deep-Dive Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1E1E24] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusColor(selectedRecord.status)}`}>
                    {selectedRecord.status}
                  </span>
                  <span className="text-xs text-neutral-400">{selectedRecord.discipline}</span>
                </div>
                <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-white mt-1">
                  {selectedRecord.conceptName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cognitive Diagnosis Anatomy */}
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 space-y-1">
                <span className="font-bold uppercase tracking-wider text-[10px] text-rose-600 dark:text-rose-400">
                  What You Did (Error Symptom):
                </span>
                <p className="text-sm font-medium">{selectedRecord.identifiedMisconception}</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
                <span className="font-bold uppercase tracking-wider text-[10px] text-amber-600 dark:text-amber-400">
                  Why This Happened (Cognitive Root Cause):
                </span>
                <p className="text-xs leading-relaxed">
                  The mind generalizes pattern recognition from continuous spaces into discrete pointers without updating the boundary invariant rule. In loop termination, forgetting to exclude the already-checked midpoint creates infinite cycles.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-brand/10 border border-brand/20 text-[#141414] dark:text-white space-y-1">
                <span className="font-bold uppercase tracking-wider text-[10px] text-brand">
                  Scaffolded Micro-Intervention:
                </span>
                <p className="text-xs font-semibold">{selectedRecord.remedialInterventionTitle}</p>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-2">
                <span className="font-bold text-neutral-700 dark:text-neutral-300">
                  Recommended Curated Reference:
                </span>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                  <span>Interactive Proof Sandbox • VisuAlgo Invariants</span>
                  <a
                    href="https://visualgo.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand font-bold hover:underline flex items-center space-x-1"
                  >
                    <span>Launch Resource</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-white hover:bg-black/10 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  practice(selectedRecord);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand to-[#EC4899] text-white hover:opacity-95 shadow transition flex items-center space-x-1.5"
              >
                <span>Start Practice Loop</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

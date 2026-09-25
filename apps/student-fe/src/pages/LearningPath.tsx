import React, { useState } from "react";
import { 
  CheckCircle2, Clock, Lock, Sparkles, ArrowRight, ShieldCheck, 
  Award, BookOpen, Layers, Milestone, ChevronRight, Zap
} from "lucide-react";
import { useThemeMode } from "../context/ThemeModeContext";

interface StageDetail {
  id: number;
  number: string;
  title: string;
  status: "completed" | "active" | "upcoming" | "locked";
  duration: string;
  masteryPercentage: number;
  description: string;
  prerequisites: string[];
  subConcepts: {
    name: string;
    completed: boolean;
    misconceptionCleared?: string;
  }[];
  badgeName: string;
  badgeEarned: boolean;
}

const STAGES: StageDetail[] = [
  {
    id: 1,
    number: "Stage 01",
    title: "Foundational Number Systems & Integer Rules",
    status: "completed",
    duration: "6 Hours • 8 Modules",
    masteryPercentage: 100,
    description: "Mastered negative signs, order of operations (PEMDAS), rational numbers, and number line displacements.",
    prerequisites: ["Primary Arithmetic", "Positive Fractions"],
    subConcepts: [
      { name: "Absolute values and distance from origin", completed: true, misconceptionCleared: "Absolute Value as Operator" },
      { name: "Multiplying two negative numbers", completed: true, misconceptionCleared: "Sign Cancellation Debt" },
      { name: "Rational and Irrational number distinctions", completed: true },
      { name: "Exponent laws for negative bases", completed: true },
    ],
    badgeName: "Integer Master Badge",
    badgeEarned: true,
  },
  {
    id: 2,
    number: "Stage 02",
    title: "Algebraic Expressions & Distributive Laws",
    status: "active",
    duration: "8 Hours • 12 Modules",
    masteryPercentage: 88,
    description: "Current Focus: Expanding binomials, distributing negative multipliers across terms, and collecting like terms safely.",
    prerequisites: ["Integer Rules", "Variable Representation"],
    subConcepts: [
      { name: "Distributive Property a(b + c)", completed: true, misconceptionCleared: "Omission of Multiplier on Constant" },
      { name: "Negative factor expansion -2(x - 9)", completed: true, misconceptionCleared: "Sign Inversion Pitfall" },
      { name: "Combining algebraic like terms", completed: true },
      { name: "Isomorphic verification challenges", completed: false },
    ],
    badgeName: "Expression Alchemist",
    badgeEarned: false,
  },
  {
    id: 3,
    number: "Stage 03",
    title: "Linear Equations & Multi-Variable Systems",
    status: "upcoming",
    duration: "10 Hours • 14 Modules",
    masteryPercentage: 0,
    description: "Upcoming: Equation balancing scales, simultaneous elimination, graphical coordinate intersections, and word problem modeling.",
    prerequisites: ["Algebraic Expressions", "Cartesian Coordinates"],
    subConcepts: [
      { name: "Maintaining balance across equals signs", completed: false },
      { name: "Simultaneous linear elimination", completed: false },
      { name: "Slope-intercept geometry (y = mx + c)", completed: false },
      { name: "Real-world rate and distance constraint models", completed: false },
    ],
    badgeName: "Linear Tactician",
    badgeEarned: false,
  },
  {
    id: 4,
    number: "Stage 04",
    title: "Quadratic Relations & Parabolic Geometry",
    status: "locked",
    duration: "12 Hours • 16 Modules",
    masteryPercentage: 0,
    description: "Locked: Completing the square physically, discriminant analysis (b² - 4ac), quadratic formula proofs, and trajectory arcs.",
    prerequisites: ["Linear Systems", "Polynomial Products"],
    subConcepts: [
      { name: "Geometric square completion area models", completed: false },
      { name: "Quadratic root derivation", completed: false },
      { name: "Parabolic vertices and symmetries", completed: false },
    ],
    badgeName: "Parabola Pioneer",
    badgeEarned: false,
  },
  {
    id: 5,
    number: "Stage 05",
    title: "Applied Modeling & Olympiad Problem Solving",
    status: "locked",
    duration: "14 Hours • 18 Modules",
    masteryPercentage: 0,
    description: "Locked: Multi-step Olympiad challenges, discrete optimization, modular arithmetic, and advanced proof methodologies.",
    prerequisites: ["Quadratic Mastery", "Spatial Geometry"],
    subConcepts: [
      { name: "Olympiad modular congruence", completed: false },
      { name: "Diophantine constraint optimization", completed: false },
      { name: "Non-routine competitive mathematics", completed: false },
    ],
    badgeName: "Grand Olympiad Master",
    badgeEarned: false,
  },
];

export const LearningPath: React.FC = () => {
  const { mode } = useThemeMode();
  const [selectedStageId, setSelectedStageId] = useState<number>(2);

  const selectedStage = STAGES.find((s) => s.id === selectedStageId) || STAGES[1];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#8266F0]/10 text-[#8266F0] font-semibold text-xs tracking-wider uppercase mb-4 border border-[#8266F0]/20">
          <Milestone className="w-3.5 h-3.5" />
          <span>Cognitive Progression Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-display mb-4">
          5-Stage Learning Paths
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed">
          A structured conceptual roadmap that prevents fragmented learning. Every stage builds on prerequisite confidence verified through AI diagnostic loops.
        </p>
      </div>

      {/* Progression Ribbon Overview */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 border border-black/5 dark:border-white/10 shadow-sm mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-neutral-900 dark:text-white">
              Curriculum Milestone Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              Click any stage to inspect concept dependencies and prerequisite verification.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center space-x-1.5 text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>1 Completed</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[#8266F0]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8266F0] animate-pulse"></span>
              <span>1 Active</span>
            </span>
            <span className="flex items-center space-x-1.5 text-neutral-400">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
              <span>3 Queued</span>
            </span>
          </div>
        </div>

        {/* 5 Stages Horizontal Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {STAGES.map((stage) => {
            const isSelected = stage.id === selectedStageId;
            let statusBadge = null;

            if (stage.status === "completed") {
              statusBadge = (
                <div className="flex items-center space-x-1 text-emerald-600 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mastered</span>
                </div>
              );
            } else if (stage.status === "active") {
              statusBadge = (
                <div className="flex items-center space-x-1 text-[#8266F0] text-[11px] font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Active Diagnostic</span>
                </div>
              );
            } else if (stage.status === "upcoming") {
              statusBadge = (
                <div className="flex items-center space-x-1 text-amber-500 text-[11px] font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Next Up</span>
                </div>
              );
            } else {
              statusBadge = (
                <div className="flex items-center space-x-1 text-neutral-400 text-[11px] font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Prereq Locked</span>
                </div>
              );
            }

            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                className={`p-4 rounded-2xl text-left transition-all duration-200 border flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#8266F0]/10 border-[#8266F0] shadow-md ring-2 ring-[#8266F0]/20"
                    : "bg-neutral-50 dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-neutral-400">
                      {stage.number}
                    </span>
                    {statusBadge}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-2">
                    {stage.title}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10">
                  <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                    <span>Mastery</span>
                    <span className="font-bold">{stage.masteryPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        stage.status === "completed"
                          ? "bg-emerald-500"
                          : stage.status === "active"
                          ? "bg-[#8266F0]"
                          : "bg-neutral-400"
                      }`}
                      style={{ width: `${stage.masteryPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Deep-Dive Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stage Overview & Modules */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 border border-black/5 dark:border-white/10 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#8266F0]/10 text-[#8266F0]">
                  {selectedStage.number}
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  {selectedStage.duration}
                </span>
              </div>
              {selectedStage.status === "active" && (
                <a
                  href="#diagnostic"
                  className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[#EC4899] text-white text-xs font-bold shadow-md shadow-[#EC4899]/25 hover:bg-[#d63b84] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Resume Stage Diagnostic</span>
                </a>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-display text-neutral-900 dark:text-white mb-3">
              {selectedStage.title}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed mb-6">
              {selectedStage.description}
            </p>

            {/* Sub-Concepts Checklist */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Curriculum Concepts & Misconception Gates:
              </h3>
              {selectedStage.subConcepts.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    item.completed
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-neutral-50 dark:bg-white/5 border-black/5 dark:border-white/10"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600 shrink-0 mt-0.5"></div>
                    )}
                    <div>
                      <div className={`text-sm font-semibold ${item.completed ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                        {item.name}
                      </div>
                      {item.misconceptionCleared && (
                        <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1 flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5 inline" />
                          <span>Cleared Misconception: {item.misconceptionCleared}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                    {item.completed ? "Verified" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Prerequisites & Micro-Credentials */}
        <div className="space-y-6">
          {/* Prerequisites Card */}
          <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-sm">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
              <Layers className="w-4 h-4 text-[#8266F0]" />
              <span>Prerequisite Concepts Map</span>
            </div>
            <div className="space-y-2">
              {selectedStage.prerequisites.map((prereq, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{prereq}</span>
                  <span className="text-emerald-600 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Satisfied</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 mt-4 leading-normal">
              LearnLens validates all prerequisite foundations prior to unlocking advanced stages to prevent cumulative learning loss.
            </p>
          </div>

          {/* Micro-Credential Milestone Badge Card */}
          <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20">
              <Award className="w-8 h-8" />
            </div>
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">
              Stage Milestone Credential
            </span>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-1">
              {selectedStage.badgeName}
            </h3>
            <p className="text-xs text-neutral-500 mt-2 mb-4">
              Awarded upon achieving ≥85% isomorphic retention across all sub-concepts and zero recurring sign errors.
            </p>
            <div className={`py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider inline-block ${
              selectedStage.badgeEarned
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-neutral-100 dark:bg-white/5 text-neutral-400"
            }`}>
              {selectedStage.badgeEarned ? "★ Credential Earned" : "In Progress (88%)"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

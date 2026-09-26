import React, { useState } from "react";
import { Brain, CheckCircle2, AlertTriangle, Lock, ArrowRight, Info, Zap } from "lucide-react";
import { ConceptNode } from "../types";

interface InteractiveMindMapProps {
  discipline: string;
  activeConceptName: string;
}

export const InteractiveMindMap: React.FC<InteractiveMindMapProps> = ({
  discipline,
  activeConceptName,
}) => {
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);

  // Generate dynamic nodes based on active discipline
  const getNodes = (): ConceptNode[] => {
    if (discipline === "Computer Science") {
      return [
        {
          id: "cs-prereq-1",
          label: "Array Memory Indexing",
          category: "prerequisite",
          mastery: 95,
          status: "mastered",
          description: "Contiguous 0-indexed memory offsets in 32/64-bit address spaces.",
          connections: ["cs-active"],
        },
        {
          id: "cs-prereq-2",
          label: "Monotonic Ordering Axiom",
          category: "prerequisite",
          mastery: 88,
          status: "mastered",
          description: "Strictly ascending or non-decreasing sequence property required for binary search.",
          connections: ["cs-active"],
        },
        {
          id: "cs-active",
          label: activeConceptName || "Binary Search Boundary Invariant",
          category: "active",
          mastery: 42,
          status: "active-struggle",
          description: "Strictly reducing search space (high = mid - 1) preventing 2-element infinite loops.",
          connections: ["cs-target-1", "cs-target-2"],
        },
        {
          id: "cs-target-1",
          label: "Rotated Sorted Search",
          category: "target",
          mastery: 20,
          status: "locked",
          description: "Sub-array inflection point identification in O(log N) runtime.",
          connections: [],
        },
        {
          id: "cs-target-2",
          label: "Median of Two Sorted Arrays",
          category: "target",
          mastery: 10,
          status: "locked",
          description: "Dual partition binary search with recursive boundary balance.",
          connections: [],
        },
      ];
    }

    if (discipline === "Medicine & Physiology") {
      return [
        {
          id: "med-prereq-1",
          label: "Nernst Equilibrium Potentials",
          category: "prerequisite",
          mastery: 92,
          status: "mastered",
          description: "Electrochemical equilibrium: Na+ (+65mV), K+ (-96mV), Ca2+ (+120mV).",
          connections: ["med-active"],
        },
        {
          id: "med-prereq-2",
          label: "Phase 0 Fast Na+ Influx",
          category: "prerequisite",
          mastery: 90,
          status: "mastered",
          description: "Nav1.5 voltage-gated opening driving rapid myocardial depolarization to +20mV.",
          connections: ["med-active"],
        },
        {
          id: "med-active",
          label: activeConceptName || "Phase 3 K+ Rapid Repolarization",
          category: "active",
          mastery: 48,
          status: "active-struggle",
          description: "IKr and IKs delayed rectifier channel efflux returning membrane to -90mV rest.",
          connections: ["med-target-1", "med-target-2"],
        },
        {
          id: "med-target-1",
          label: "Long QT Syndrome Pathophysiology",
          category: "target",
          mastery: 25,
          status: "locked",
          description: "Channelopathies predisposing to Torsades de Pointes ventricular fibrillation.",
          connections: [],
        },
        {
          id: "med-target-2",
          label: "Antiarrhythmic Drug Classification",
          category: "target",
          mastery: 15,
          status: "locked",
          description: "Vaughan-Williams Class III potassium channel blocking pharmacology.",
          connections: [],
        },
      ];
    }

    if (discipline === "Commerce & Finance") {
      return [
        {
          id: "fin-prereq-1",
          label: "Accrual Recognition Concept",
          category: "prerequisite",
          mastery: 94,
          status: "mastered",
          description: "Matching revenues with expenses regardless of when liquid cash changes hands.",
          connections: ["fin-active"],
        },
        {
          id: "fin-prereq-2",
          label: "Working Capital Fundamentals",
          category: "prerequisite",
          mastery: 86,
          status: "mastered",
          description: "Current Assets minus Current Liabilities operating cycle timing.",
          connections: ["fin-active"],
        },
        {
          id: "fin-active",
          label: activeConceptName || "Indirect Operating Cash Flow Adjustments",
          category: "active",
          mastery: 50,
          status: "active-struggle",
          description: "Subtracting non-cash revenue growth (AR expansion) and liability settlements (AP drop).",
          connections: ["fin-target-1", "fin-target-2"],
        },
        {
          id: "fin-target-1",
          label: "Free Cash Flow to Firm (FCFF)",
          category: "target",
          mastery: 30,
          status: "locked",
          description: "CFO plus Interest(1 - t) minus CapEx for enterprise DCF valuation.",
          connections: [],
        },
        {
          id: "fin-target-2",
          label: "Working Capital Stress Testing",
          category: "target",
          mastery: 20,
          status: "locked",
          description: "Cash conversion cycle (DSO + DIO - DPO) during rapid corporate scale-up.",
          connections: [],
        },
      ];
    }

    // Default / Mathematics
    return [
      {
        id: "math-prereq-1",
        label: "Signed Integer Axioms",
        category: "prerequisite",
        mastery: 98,
        status: "mastered",
        description: "Negative times negative yields positive wealth: (-a) × (-b) = +ab.",
        connections: ["math-active"],
      },
      {
        id: "math-prereq-2",
        label: "Geometric Area Distribution",
        category: "prerequisite",
        mastery: 85,
        status: "mastered",
        description: "The outside factor scales every term inside: a(b + c) = ab + ac.",
        connections: ["math-active"],
      },
      {
        id: "math-active",
        label: activeConceptName || "Negative Factor Parentheses Distribution",
        category: "active",
        mastery: 44,
        status: "active-struggle",
        description: "Avoiding sign drop traps when distributing negative constants: -2(x - 9) = -2x + 18.",
        connections: ["math-target-1", "math-target-2"],
      },
      {
        id: "math-target-1",
        label: "Systems of Linear Equations",
        category: "target",
        mastery: 35,
        status: "locked",
        description: "Simultaneous 2-variable algebraic elimination without sign flip slips.",
        connections: [],
      },
      {
        id: "math-target-2",
        label: "Quadratic Factoring & Roots",
        category: "target",
        mastery: 15,
        status: "locked",
        description: "Splitting middle terms and completing the square for parabolic curves.",
        connections: [],
      },
    ];
  };

  const nodes = getNodes();
  const prereqNodes = nodes.filter((n) => n.category === "prerequisite");
  const activeNode = nodes.find((n) => n.category === "active")!;
  const targetNodes = nodes.filter((n) => n.category === "target");

  return (
    <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-brand text-white">
              <Brain className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand">
              Universal Knowledge Graph Topology
            </span>
          </div>
          <h3 className="mt-1 font-display font-bold text-xl text-[#141414] dark:text-white">
            Interactive Cognitive Concept Mind Map
          </h3>
          <p className="text-xs text-neutral-500">
            Click any concept node to explore prerequisite dependencies, failure points, and target pathways.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center space-x-1 text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mastered</span>
          </span>
          <span className="text-neutral-300">•</span>
          <span className="flex items-center space-x-1 text-rose-500 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Active Hurdle</span>
          </span>
          <span className="text-neutral-300">•</span>
          <span className="flex items-center space-x-1 text-neutral-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Target Mastery</span>
          </span>
        </div>
      </div>

      {/* Visual Graph Layout */}
      <div className="relative py-6 px-4 bg-neutral-50/70 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10 overflow-x-auto">
        <div className="min-w-[620px] flex items-center justify-between gap-6">
          {/* COLUMN 1: Prerequisites */}
          <div className="flex-1 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-center">
              1. Prerequisite Foundations
            </div>
            {prereqNodes.map((node) => (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  selectedNode?.id === node.id
                    ? "bg-emerald-500/20 border-emerald-500 shadow-md"
                    : "bg-white dark:bg-[#25252D] border-emerald-500/30 hover:border-emerald-500 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {node.label}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600">
                    {node.mastery}%
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[11px] text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Verified Prerequisite</span>
                </div>
              </button>
            ))}
          </div>

          {/* Connection Arrows 1 -> 2 */}
          <div className="flex flex-col items-center justify-center text-brand space-y-2">
            <ArrowRight className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-brand">
              Synthesizes
            </span>
          </div>

          {/* COLUMN 2: Active Focus Concept */}
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-500 text-center mb-4">
              2. Active Diagnostic Hurdle
            </div>
            <button
              onClick={() => setSelectedNode(activeNode)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                selectedNode?.id === activeNode.id
                  ? "bg-rose-500/15 border-rose-500 shadow-lg"
                  : "bg-rose-500/10 border-rose-500/50 hover:border-rose-500 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                  {activeNode.label}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-600">
                  {activeNode.mastery}% Mastery
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-slate-300 leading-snug line-clamp-2">
                {activeNode.description}
              </p>
              <div className="mt-2 flex items-center space-x-1 text-[11px] text-rose-600 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Misconception Under Remediation</span>
              </div>
            </button>
          </div>

          {/* Connection Arrows 2 -> 3 */}
          <div className="flex flex-col items-center justify-center text-neutral-400 space-y-2">
            <ArrowRight className="w-5 h-5" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Unlocks
            </span>
          </div>

          {/* COLUMN 3: Target Application Topics */}
          <div className="flex-1 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-center">
              3. Next Target Mastery
            </div>
            {targetNodes.map((node) => (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  selectedNode?.id === node.id
                    ? "bg-neutral-200 dark:bg-white/10 border-neutral-400 shadow-md"
                    : "bg-white/80 dark:bg-[#25252D]/80 border-black/10 dark:border-white/10 hover:border-neutral-400 shadow-sm opacity-80"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 truncate">
                    {node.label}
                  </span>
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  Prerequisite Clearance Needed
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-start space-x-3 animate-in fade-in duration-150">
          <div className="p-2 rounded-xl bg-white dark:bg-[#1E1E24] shadow-sm text-brand shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                {selectedNode.label}
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10">
                {selectedNode.category}
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-slate-300 mt-1 leading-relaxed">
              {selectedNode.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

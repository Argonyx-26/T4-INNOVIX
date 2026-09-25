import React, { useState } from "react";
import { 
  Zap, Clock, Award, TrendingUp, Sliders, ArrowRight, RotateCcw, 
  CheckCircle2, Sparkles, Scale, Activity, Play, Info, HelpCircle
} from "lucide-react";
import { useThemeMode } from "../context/ThemeModeContext";

export const AdaptivePacing: React.FC = () => {
  const { mode } = useThemeMode();

  // Active lab tab
  const [activeLab, setActiveLab] = useState<"distributive" | "signs" | "scales">("distributive");

  // Lab 1: Distributive Law State
  const [factorA, setFactorA] = useState<number>(3);
  const [termB, setTermB] = useState<number>(4);
  const [termC, setTermC] = useState<number>(5);

  // Lab 2: Sign Flip State
  const [initialValue, setInitialValue] = useState<number>(4);
  const [multiplier, setMultiplier] = useState<number>(-2);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Lab 3: Scale State (2x + 4 = 10)
  const [leftWeight, setLeftWeight] = useState<{ xCount: number; constants: number }>({ xCount: 2, constants: 4 });
  const [rightWeight, setRightWeight] = useState<number>(10);
  const [scaleHistory, setScaleHistory] = useState<string[]>(["Initial: 2x + 4 = 10"]);
  const [scaleSolved, setScaleSolved] = useState<boolean>(false);

  // Scale actions
  const handleScaleAction = (action: "subtract4" | "divide2" | "reset") => {
    if (action === "reset") {
      setLeftWeight({ xCount: 2, constants: 4 });
      setRightWeight(10);
      setScaleHistory(["Initial: 2x + 4 = 10"]);
      setScaleSolved(false);
      return;
    }

    if (action === "subtract4" && leftWeight.constants === 4) {
      setLeftWeight({ ...leftWeight, constants: 0 });
      setRightWeight(rightWeight - 4);
      setScaleHistory((prev) => [...prev, "Subtract 4 from both sides: 2x = 6"]);
    } else if (action === "divide2" && leftWeight.constants === 0 && leftWeight.xCount === 2) {
      setLeftWeight({ xCount: 1, constants: 0 });
      setRightWeight(rightWeight / 2);
      setScaleHistory((prev) => [...prev, "Divide both sides by 2: x = 3"]);
      setScaleSolved(true);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-4 border border-emerald-500/20">
          <Activity className="w-3.5 h-3.5" />
          <span>Real-time Velocity & Micro-Intervention Telemetry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-display mb-4">
          Intelligent Adaptive Pacing
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed">
          Traditional curricula force students into a rigid calendar pace. LearnLens continuously measures cognitive recovery velocity, automatically compacting mastered modules and unlocking interactive cognitive labs.
        </p>
      </div>

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-[#1E1E24] p-6 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Dynamic Velocity
            </div>
            <div className="text-3xl font-bold font-display text-neutral-900 dark:text-white">
              2.4x
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 inline" />
              <span>Faster than standard linear progression</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E1E24] p-6 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8266F0]/10 text-[#8266F0] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Cognitive Hours Saved
            </div>
            <div className="text-3xl font-bold font-display text-neutral-900 dark:text-white">
              34.5 Hrs
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              By clearing prerequisite debt instead of repeating topics
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E1E24] p-6 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Mastery Efficiency
            </div>
            <div className="text-3xl font-bold font-display text-neutral-900 dark:text-white">
              92.8%
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              Isomorphic retention rate measured at 14-day intervals
            </p>
          </div>
        </div>
      </div>

      {/* Trajectory Graph Comparison Card */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 border border-black/5 dark:border-white/10 shadow-sm mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-white">
              Learning Trajectory: Linear School vs. LearnLens Adaptive
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Comparison across Class 9 algebra syllabus (Terms 1 & 2)
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
              <span className="text-neutral-500">Standard School (Linear 1.0x)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-[#8266F0]"></span>
              <span className="text-[#8266F0] font-semibold">LearnLens AI Adaptive (2.4x)</span>
            </div>
          </div>
        </div>

        {/* Visual Graph Representation */}
        <div className="relative pt-6 pb-2">
          {/* Grid lines */}
          <div className="space-y-8">
            <div className="border-b border-dashed border-black/5 dark:border-white/10 pb-1 flex justify-between text-[11px] text-neutral-400">
              <span>Stage 5: Olympiad Problem Solving</span>
              <span className="text-emerald-500 font-bold">LearnLens Day 48</span>
            </div>
            <div className="border-b border-dashed border-black/5 dark:border-white/10 pb-1 flex justify-between text-[11px] text-neutral-400">
              <span>Stage 4: Quadratic & Complex Systems</span>
              <span className="text-[#8266F0] font-semibold">LearnLens Day 35</span>
            </div>
            <div className="border-b border-dashed border-black/5 dark:border-white/10 pb-1 flex justify-between text-[11px] text-neutral-400">
              <span>Stage 3: Linear Equations Mastery</span>
              <span className="text-neutral-400">School Day 90 / LearnLens Day 20</span>
            </div>
            <div className="border-b border-dashed border-black/5 dark:border-white/10 pb-1 flex justify-between text-[11px] text-neutral-400">
              <span>Stage 2: Algebraic Distributive Laws</span>
              <span className="text-neutral-400">School Day 45 / LearnLens Day 8</span>
            </div>
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>Stage 1: Foundational Integer Rules</span>
              <span className="text-neutral-400">Day 0 Diagnostic Baseline</span>
            </div>
          </div>

          {/* Trajectory comparison bars / curves */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-100/80 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-neutral-600 dark:text-neutral-400">Linear Fixed Calendar (Class 9)</span>
                <span className="text-neutral-500">180 School Days</span>
              </div>
              <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-neutral-400 rounded-full" style={{ width: "45%" }}></div>
              </div>
              <p className="text-[11px] text-neutral-500 mt-2">
                42% of classroom time spent reviewing misconceptions student already understood, or blocked on undetected prerequisite gaps.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#8266F0]/10 border border-[#8266F0]/20">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-[#8266F0]">LearnLens Cognitive Pacing</span>
                <span className="text-[#8266F0] font-bold">54 Days to Full Mastery</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#8266F0]/20 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#8266F0] to-[#EC4899] rounded-full" style={{ width: "92%" }}></div>
              </div>
              <p className="text-[11px] text-[#8266F0] font-medium mt-2">
                60-second micro-interventions remove negative integer sign debt immediately, accelerating polynomial and quadratic modules.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Cognitive Laboratory Modules */}
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#8266F0] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hands-on Mental Model Simulators</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-neutral-900 dark:text-white">
              Interactive Cognitive Labs
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Manipulate concrete models to cement the abstract rules discovered in diagnostic assessments.
            </p>
          </div>

          {/* Lab Selector Tabs */}
          <div className="flex bg-neutral-100 dark:bg-[#1E1E24] p-1.5 rounded-2xl border border-black/5 dark:border-white/10">
            <button
              onClick={() => setActiveLab("distributive")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeLab === "distributive"
                  ? "bg-white dark:bg-neutral-800 text-[#8266F0] shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              }`}
            >
              1. Distributive Law
            </button>
            <button
              onClick={() => setActiveLab("signs")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeLab === "signs"
                  ? "bg-white dark:bg-neutral-800 text-[#8266F0] shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              }`}
            >
              2. Sign Flips
            </button>
            <button
              onClick={() => setActiveLab("scales")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeLab === "scales"
                  ? "bg-white dark:bg-neutral-800 text-[#8266F0] shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              }`}
            >
              3. Variable Scales
            </button>
          </div>
        </div>

        {/* Lab Content Panes */}
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 border border-black/5 dark:border-white/10 shadow-sm">
          {/* Lab 1: Distributive Law Area Model */}
          {activeLab === "distributive" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-white/10">
                <div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-white">
                    Distributive Law Area Simulator: a(b + c) = ab + ac
                  </h3>
                  <p className="text-sm text-neutral-500">
                    See why the outside multiplier <code className="bg-neutral-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-neutral-800 dark:text-neutral-200 font-mono font-bold">a</code> distributes to EVERY term inside the bracket.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">Total Area</span>
                  <div className="text-2xl font-bold text-[#8266F0] font-mono">
                    {factorA} × ({termB} + {termC}) = {factorA * (termB + termC)}
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-neutral-50 dark:bg-white/5 p-6 rounded-2xl">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                    <span>Outside Multiplier (a):</span>
                    <span className="font-mono text-[#8266F0] font-bold text-sm">{factorA}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={factorA}
                    onChange={(e) => setFactorA(Number(e.target.value))}
                    className="w-full accent-[#8266F0]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                    <span>First Term (b):</span>
                    <span className="font-mono text-emerald-600 font-bold text-sm">{termB}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={termB}
                    onChange={(e) => setTermB(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                    <span>Second Term (c):</span>
                    <span className="font-mono text-pink-500 font-bold text-sm">{termC}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={termC}
                    onChange={(e) => setTermC(Number(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>

              {/* Visual Area Decomposition */}
              <div className="pt-4 flex flex-col items-center">
                <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                  Visual Rectangle Area Breakdown:
                </div>
                <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-4">
                  {/* Height Indicator */}
                  <div className="h-44 flex flex-col items-center justify-center pr-3 border-r-2 border-dashed border-[#8266F0]">
                    <span className="text-xs font-mono font-bold text-[#8266F0] rotate-[-90deg] whitespace-nowrap">
                      Height a = {factorA}
                    </span>
                  </div>

                  {/* Left Block: a * b */}
                  <div
                    className="h-44 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 flex flex-col items-center justify-center p-4 transition-all duration-300"
                    style={{ width: `${Math.max(termB * 28, 90)}px` }}
                  >
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Sub-Area 1</span>
                    <span className="text-lg font-mono font-bold text-emerald-800 dark:text-emerald-300">
                      {factorA} × {termB} = {factorA * termB}
                    </span>
                    <span className="text-[11px] text-emerald-600 mt-1 font-mono">Width: {termB}</span>
                  </div>

                  <div className="text-2xl font-bold text-neutral-400">+</div>

                  {/* Right Block: a * c */}
                  <div
                    className="h-44 rounded-2xl bg-pink-500/20 border-2 border-pink-500 flex flex-col items-center justify-center p-4 transition-all duration-300"
                    style={{ width: `${Math.max(termC * 28, 90)}px` }}
                  >
                    <span className="text-xs font-bold text-pink-700 dark:text-pink-400 uppercase tracking-wider">Sub-Area 2</span>
                    <span className="text-lg font-mono font-bold text-pink-800 dark:text-pink-300">
                      {factorA} × {termC} = {factorA * termC}
                    </span>
                    <span className="text-[11px] text-pink-600 mt-1 font-mono">Width: {termC}</span>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-neutral-100 dark:bg-white/5 text-sm text-center max-w-xl text-neutral-600 dark:text-neutral-400">
                  💡 <strong>Cognitive Key:</strong> Notice how the height <strong className="text-[#8266F0]">{factorA}</strong> is shared by both rectangles. That is why multiplying only the first term and writing <code className="text-rose-500">{factorA}x + {termC}</code> is a geometric violation!
                </div>
              </div>
            </div>
          )}

          {/* Lab 2: Sign Flips & Number Lines */}
          {activeLab === "signs" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-white/10">
                <div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-white">
                    Sign Flips & Number Line Simulator
                  </h3>
                  <p className="text-sm text-neutral-500">
                    Multiplying by a negative number physically reverses vector orientation across origin 0.
                  </p>
                </div>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-4 py-2 rounded-xl bg-[#8266F0] text-white text-xs font-semibold hover:bg-[#7052eb] flex items-center space-x-1.5 shadow-md shadow-[#8266F0]/25"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Toggle Multiplier Sign (× -1)</span>
                </button>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-neutral-50 dark:bg-white/5 p-6 rounded-2xl">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                    <span>Base Value:</span>
                    <span className="font-mono text-emerald-600 font-bold">{initialValue}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={initialValue}
                    onChange={(e) => setInitialValue(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                    <span>Multiplier Factor:</span>
                    <span className="font-mono text-[#8266F0] font-bold">
                      {isFlipped ? -Math.abs(multiplier) : Math.abs(multiplier)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={Math.abs(multiplier)}
                    onChange={(e) => setMultiplier(isFlipped ? -Number(e.target.value) : Number(e.target.value))}
                    className="w-full accent-[#8266F0]"
                  />
                </div>
              </div>

              {/* Number Line Visualizer */}
              <div className="py-8 px-4 flex flex-col items-center">
                {(() => {
                  const effectiveMultiplier = isFlipped ? -Math.abs(multiplier) : Math.abs(multiplier);
                  const result = initialValue * effectiveMultiplier;
                  return (
                    <div className="w-full max-w-2xl">
                      {/* Equation Banner */}
                      <div className="text-center mb-6">
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Operation:</span>
                        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
                          ({initialValue}) × ({effectiveMultiplier}) ={" "}
                          <span className={result < 0 ? "text-rose-500 font-extrabold" : "text-emerald-500 font-extrabold"}>
                            {result > 0 ? `+${result}` : result}
                          </span>
                        </div>
                      </div>

                      {/* Number Line Axis */}
                      <div className="relative w-full h-16 flex items-center justify-center">
                        <div className="absolute w-full h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full"></div>
                        
                        {/* 0 Origin */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-3 h-8 bg-neutral-900 dark:bg-white rounded flex items-end justify-center pb-1">
                          <span className="absolute -bottom-6 text-xs font-bold font-mono">0</span>
                        </div>

                        {/* Vector Arc */}
                        <div
                          className={`absolute top-0 h-8 border-t-2 rounded-t-full transition-all duration-500 ${
                            result < 0
                              ? "right-1/2 border-rose-500 bg-rose-500/10"
                              : "left-1/2 border-emerald-500 bg-emerald-500/10"
                          }`}
                          style={{
                            width: `${Math.min(Math.abs(result) * 2.2, 45)}%`,
                          }}
                        >
                          <div className={`absolute top-[-10px] ${result < 0 ? "left-0" : "right-0"} text-xs font-bold font-mono ${result < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                            ▼ {result}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                        ⚡ <strong>Debt Multiplier Rule:</strong> A negative sign is an <em>operator</em> that reflects across zero. When you have two negatives like <code className="font-mono font-bold">-2 × (-9)</code>, the first negative flips left, and the second negative flips it back right into positive <code className="font-mono font-bold text-emerald-600">+18</code>!
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Lab 3: Variable Balancing Scales */}
          {activeLab === "scales" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/5 dark:border-white/10">
                <div>
                  <h3 className="text-xl font-bold font-display text-neutral-900 dark:text-white">
                    Variable Balancing Scales: Maintain Equation Equilibrium
                  </h3>
                  <p className="text-sm text-neutral-500">
                    Solve <code className="font-bold text-neutral-800 dark:text-neutral-200">2x + 4 = 10</code> by applying equal operations to both pans.
                  </p>
                </div>
                <button
                  onClick={() => handleScaleAction("reset")}
                  className="px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Pan Weights</span>
                </button>
              </div>

              {/* Physical Scale Graphic */}
              <div className="py-6 flex flex-col items-center">
                <div className="w-full max-w-xl bg-neutral-50 dark:bg-white/5 p-8 rounded-3xl border border-black/5 dark:border-white/10 relative">
                  {/* Scale Beam */}
                  <div className="w-4/5 mx-auto h-3 bg-neutral-800 dark:bg-neutral-300 rounded-full relative mb-12 flex justify-between items-center px-4">
                    {/* Fulcrum Triangle */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-3 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[28px] border-b-neutral-800 dark:border-b-neutral-300"></div>
                  </div>

                  {/* Left & Right Pans */}
                  <div className="grid grid-cols-2 gap-8 items-end">
                    {/* Left Pan */}
                    <div className="flex flex-col items-center">
                      <div className="flex flex-wrap justify-center gap-2 mb-3 min-h-[50px] items-center">
                        {Array.from({ length: leftWeight.xCount }).map((_, i) => (
                          <div key={`x-${i}`} className="w-10 h-10 rounded-xl bg-[#8266F0] text-white font-bold flex items-center justify-center text-sm shadow-md">
                            x
                          </div>
                        ))}
                        {Array.from({ length: leftWeight.constants }).map((_, i) => (
                          <div key={`c-${i}`} className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                            1
                          </div>
                        ))}
                      </div>
                      <div className="w-36 h-4 bg-neutral-400 dark:bg-neutral-600 rounded-b-xl border-t-2 border-neutral-700"></div>
                      <span className="text-xs font-bold font-mono mt-2 text-neutral-600 dark:text-neutral-400">
                        Left: {leftWeight.xCount}x + {leftWeight.constants}
                      </span>
                    </div>

                    {/* Right Pan */}
                    <div className="flex flex-col items-center">
                      <div className="flex flex-wrap justify-center gap-1.5 mb-3 min-h-[50px] items-center max-w-[150px]">
                        {Array.from({ length: rightWeight }).map((_, i) => (
                          <div key={`r-${i}`} className="w-6 h-6 rounded-md bg-amber-500 text-white font-bold flex items-center justify-center text-[11px] shadow-sm">
                            1
                          </div>
                        ))}
                      </div>
                      <div className="w-36 h-4 bg-neutral-400 dark:bg-neutral-600 rounded-b-xl border-t-2 border-neutral-700"></div>
                      <span className="text-xs font-bold font-mono mt-2 text-neutral-600 dark:text-neutral-400">
                        Right: {rightWeight}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="mt-8 flex flex-wrap gap-3 justify-center">
                  <button
                    disabled={leftWeight.constants !== 4}
                    onClick={() => handleScaleAction("subtract4")}
                    className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                      leftWeight.constants === 4
                        ? "bg-[#8266F0] text-white hover:bg-[#7052eb] shadow-md shadow-[#8266F0]/25 cursor-pointer"
                        : "bg-neutral-200 dark:bg-white/10 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    Step 1: Subtract 4 from Both Pans (-4)
                  </button>

                  <button
                    disabled={leftWeight.constants !== 0 || leftWeight.xCount !== 2}
                    onClick={() => handleScaleAction("divide2")}
                    className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                      leftWeight.constants === 0 && leftWeight.xCount === 2
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/25 cursor-pointer"
                        : "bg-neutral-200 dark:bg-white/10 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    Step 2: Divide Both Pans by 2 (÷2)
                  </button>
                </div>

                {/* Feedback or Solved Banner */}
                {scaleSolved ? (
                  <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Scale Solved! Single unknown weight x = 3 has been isolated while maintaining perfect equilibrium.</span>
                  </div>
                ) : (
                  <div className="mt-6 text-xs text-neutral-500 flex items-center space-x-1.5">
                    <Info className="w-4 h-4 text-[#8266F0]" />
                    <span>Follow the algebraic steps above to isolate the variable <code className="font-bold">x</code>.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

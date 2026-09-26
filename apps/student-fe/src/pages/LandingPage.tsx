import React, { useState } from "react";
import { ArrowRight, Play, Volume2, VolumeX, X, Check, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useThemeMode } from "../context/ThemeModeContext";

interface LandingPageProps {
  onNavigate: (hash: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { mode, speak, stopSpeech } = useThemeMode();
  const [demoSelectedOption, setDemoSelectedOption] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Dyslexic mode forces a wide font and extra spacing on all text, so copy can't be
  // laid over the artwork; it gets its own column instead.
  const stacked = mode === "dyslexic";
  const overlayOnly = (cls: string) => (stacked ? "" : cls);

  const handleReadAloudHero = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      speak("Learning that fits your mind. Diagnose the root misconception behind any wrong answer across STEM, Code, Medicine, and Finance.");
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F7] dark:bg-[#141416] transition-colors duration-200">
      {/* The hero stays light in every theme: its artwork is a flat light-background composition. */}
      <section className="relative bg-[#F8F8F7] overflow-hidden" aria-labelledby="hero-heading">
        {/* Overlay layout: the art spans the full hero and the copy/hotspots are positioned in cqw/% so they track it at any width. */}
        <div
          className={`relative mx-auto max-w-[1672px] [container-type:inline-size] ${
            stacked ? "lg:grid lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-[5.08%] lg:py-14" : "lg:aspect-[1672/851]"
          }`}
        >
          {!stacked && (
            <>
              <img
                src="/hero-eduvia.jpg"
                alt=""
                aria-hidden="true"
                draggable={false}
                className="hidden lg:block absolute inset-0 w-full h-full select-none pointer-events-none"
              />
              <button
                onClick={() => setIsVideoModalOpen(true)}
                aria-label="Play the classroom micro-lesson preview"
                className="hidden lg:block absolute left-[30.6%] top-[62.9%] w-[27.6%] h-[28%] rounded-[999px] transition hover:ring-4 hover:ring-[#1BBC7E]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1BBC7E]"
              />
              <button
                onClick={() => onNavigate("#courses")}
                aria-label="Explore the course catalog"
                className="hidden lg:block absolute left-[82.6%] top-[11%] w-[14%] h-[32%] rounded-2xl transition hover:ring-4 hover:ring-[#FEDB4A]/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1BBC7E]"
              />
              <button
                onClick={() => onNavigate("#diagnostic")}
                aria-label="Start a diagnostic challenge"
                className="hidden lg:block absolute left-[77.4%] top-[51%] w-[17.4%] h-[20%] rounded-2xl transition hover:ring-4 hover:ring-[#1BBC7E]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1BBC7E]"
              />
              <button
                onClick={() => onNavigate("#paths")}
                aria-label="View learning paths"
                className="hidden lg:block absolute left-[69.6%] top-[84%] w-[23.8%] h-[9%] rounded-full transition hover:ring-4 hover:ring-[#1BBC7E]/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1BBC7E]"
              />
            </>
          )}

          <div className={`relative z-10 px-5 sm:px-8 pt-10 pb-8 lg:p-0 ${overlayOnly("lg:absolute lg:left-[5.08%] lg:top-[9.2%] lg:w-[47%]")}`}>
            <div className={`flex items-center gap-2 ${overlayOnly("lg:gap-[0.6cqw]")}`}>
              <span aria-hidden="true" className={`w-12 h-6 rounded-full bg-[#0B0B0B] ${overlayOnly("lg:w-[4.3cqw] lg:h-[2cqw]")}`} />
              <span aria-hidden="true" className={`w-6 h-6 rounded-full bg-[#1BBC7E] ${overlayOnly("lg:w-[2cqw] lg:h-[2cqw]")}`} />
              <span aria-hidden="true" className={`w-3.5 h-6 rounded-full bg-[#1BBC7E] ${overlayOnly("lg:w-[1.45cqw] lg:h-[2cqw]")}`} />
              <span aria-hidden="true" className={`w-10 h-6 rounded-full bg-[#1BBC7E] ${overlayOnly("lg:w-[3.6cqw] lg:h-[2cqw]")}`} />
              <span aria-hidden="true" className={`ml-1.5 h-4 w-px bg-[#0B0B0B]/35 ${overlayOnly("lg:ml-[0.4cqw] lg:h-[1.2cqw]")}`} />
              <span className={`ml-1 text-xs font-bold uppercase tracking-[0.06em] text-[#1BBC7E] ${overlayOnly("lg:ml-[0.3cqw] lg:text-[clamp(11px,1.02cqw,17px)]")}`}>
                Learn without limits
              </span>
            </div>

            <h1
              id="hero-heading"
              className={`mt-6 font-display font-extrabold text-[#0B0B0B] ${
                stacked
                  ? "leading-[1.25] text-[36px] sm:text-[48px] lg:text-[clamp(36px,3.4vw,56px)]"
                  : "leading-[1.02] tracking-[-0.03em] xl:tracking-[-0.015em] text-[44px] sm:text-[60px] lg:mt-[2.5cqw] lg:text-[5.9cqw] 2xl:text-[6.2cqw]"
              }`}
            >
              <span className={overlayOnly("lg:whitespace-nowrap")}>Learning that fits</span>{" "}
              {!stacked && <br className="hidden sm:block" />}
              <span className="relative z-0 inline-block text-[#1BBC7E]">
                your mind.
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 16"
                  preserveAspectRatio="none"
                  className="absolute -z-10 left-[10%] right-0 -bottom-[0.06em] w-[88%] h-[0.16em]"
                >
                  <path d="M3 11 Q 150 3 297 8" fill="none" stroke="#FEDB4A" strokeWidth="9" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className={`mt-6 max-w-xl text-[17px] sm:text-lg leading-[1.5] sm:leading-[1.5] text-[#211F20] ${overlayOnly("lg:mt-[2.3cqw] lg:max-w-[44cqw] lg:text-[clamp(14px,1.38cqw,23px)]")}`}>
              Eduvia diagnoses the <strong className="font-bold text-[#0B0B0B]">root misconception</strong> behind wrong answers — not just right or wrong. Tailored for{" "}
              <strong className="font-bold text-[#0B0B0B]">Standard</strong>, <strong className="font-bold text-[#0B0B0B]">ADHD</strong>, and{" "}
              <strong className="font-bold text-[#0B0B0B]">Dyslexic</strong> learners.
            </p>

            <div className={`mt-7 flex items-center gap-3 ${overlayOnly("lg:mt-[2cqw] lg:gap-[0.8cqw]")}`}>
              <a
                href="#diagnostic"
                className={`inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[#0B0B0B] text-white font-bold text-sm ${overlayOnly("lg:h-[clamp(40px,3.3cqw,56px)] lg:px-[1.7cqw] lg:text-[clamp(13px,1.05cqw,18px)]")} shadow-[0_3px_0_#1BBC7E] hover:bg-[#1BBC7E] hover:text-[#0B0B0B] hover:shadow-[0_3px_0_#0B0B0B] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1BBC7E]/50`}
              >
                <span>Start Free Diagnostic</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={handleReadAloudHero}
                aria-label={isPlayingAudio ? "Stop reading aloud" : "Read the introduction aloud"}
                className={`grid place-items-center w-12 h-12 shrink-0 ${overlayOnly("lg:w-[clamp(40px,3.3cqw,56px)] lg:h-[clamp(40px,3.3cqw,56px)]")} rounded-full border-[1.5px] border-[#0B0B0B] bg-white text-[#0B0B0B] hover:bg-[#FEDB4A] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1BBC7E]/50`}
              >
                {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Stacked layouts (small screens, dyslexic mode) show the illustrated right half of the art. */}
          <div className={`relative px-5 sm:px-8 pb-12 lg:p-0 ${overlayOnly("lg:hidden")}`}>
            <img
              src="/hero-eduvia.jpg"
              alt="Smiling student holding a phone, surrounded by learning progress cards"
              className="w-full aspect-square sm:aspect-[4/3] lg:aspect-square object-cover object-right"
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2 — The 3-Step Cognitive Loop (Chunked, Minimal Text)
          ========================================================================= */}
      <section id="how-it-works" className="scroll-mt-24 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1BBC7E]">
            HOW IT WORKS
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#111111] dark:text-white mt-1">
            Diagnose the Thinking, Not Just the Answer
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm hover:border-[#1BBC7E] transition">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold text-lg mb-4 font-mono">
              01
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
              Detect Root Misconception
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-snug">
              Identifies the underlying flawed mental model rather than penalizing mistakes as careless.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm hover:border-[#FEDB4A] transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg mb-4 font-mono">
              02
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
              3-Tier Scaffolded Hints
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-snug">
              Progressive hints: Nudge &rarr; Formula Scaffold &rarr; Structural Guidance without spoiling answers.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm hover:border-[#1BBC7E] transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4 font-mono">
              03
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
              Verify &amp; Resolve
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-snug">
              Mastery check verifies retention across isomorphic problems and updates your misconception log.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3 — Interactive Misconception Sandbox (Instant 2-Click Demo)
          ========================================================================= */}
      <section id="features" className="scroll-mt-24 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="rounded-3xl bg-white dark:bg-[#1E1E24] p-6 sm:p-8 border border-black/10 dark:border-white/10 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1BBC7E]">
                Interactive Misconception Test
              </span>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-500">
              Class 9 Math
            </span>
          </div>

          <div className="my-5 text-center">
            <p className="text-xs text-neutral-500 mb-1">Click an answer to see instant cognitive diagnosis:</p>
            <div className="text-2xl font-mono font-bold text-neutral-900 dark:text-white">
              -2(x - 9) = 14
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setDemoSelectedOption("misstep")}
              className={`p-3.5 rounded-2xl font-semibold text-sm border transition text-left flex items-center justify-between ${
                demoSelectedOption === "misstep"
                  ? "bg-rose-500 text-white border-rose-500"
                  : "bg-neutral-100 dark:bg-white/5 border-transparent text-neutral-800 dark:text-neutral-200 hover:border-neutral-300"
              }`}
            >
              <span>x = -16 (Common Misstep)</span>
              <span className="text-xs opacity-75">&rarr;</span>
            </button>

            <button
              onClick={() => setDemoSelectedOption("correct")}
              className={`p-3.5 rounded-2xl font-semibold text-sm border transition text-left flex items-center justify-between ${
                demoSelectedOption === "correct"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-neutral-100 dark:bg-white/5 border-transparent text-neutral-800 dark:text-neutral-200 hover:border-neutral-300"
              }`}
            >
              <span>x = 2 (Correct Root)</span>
              <Check className="w-4 h-4 opacity-75" aria-hidden="true" />
            </button>
          </div>

          {demoSelectedOption === "misstep" && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs animate-in fade-in">
              <strong className="text-rose-700 dark:text-rose-400 block mb-1">
                <AlertTriangle className="inline w-4 h-4 -mt-0.5 mr-1" aria-hidden="true" />Sign Inversion Detected:
              </strong>
              <p className="text-neutral-700 dark:text-neutral-300">
                Multiplying -2 by -9 yields <strong>+18</strong>, not -18. Debt cancellation rule: subtracting negative units adds positive value!
              </p>
            </div>
          )}

          {demoSelectedOption === "correct" && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs animate-in fade-in">
              <strong className="text-emerald-700 dark:text-emerald-400 block mb-1">
                <CheckCircle2 className="inline w-4 h-4 -mt-0.5 mr-1" aria-hidden="true" />Correct Algebraic Expansion:
              </strong>
              <p className="text-neutral-700 dark:text-neutral-300">
                -2x + 18 = 14 &rarr; -2x = -4 &rarr; x = 2. Check: -2(2 - 9) = -2(-7) = 14.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          MODAL: Classroom Video Preview Modal (Triggered from Hero Card)
          ========================================================================= */}
      {isVideoModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-2xl bg-white dark:bg-[#1E1E24] rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                    Classroom Cognitive Micro-Lesson
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    60-second visual explanation of prerequisite gap repair
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Simulator Frame */}
            <div className="mt-4 aspect-video rounded-2xl bg-neutral-900 overflow-hidden relative flex items-center justify-center">
              <img
                src="/hero-illustration.jpg"
                alt="Classroom preview"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 text-white">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold w-fit mb-2">
                  Interactive Micro-Lesson
                </span>
                <h4 className="text-lg font-bold">The Balance Beam Analogy for Negative Distribution</h4>
                <p className="text-xs text-neutral-300 mt-1">
                  Watch how removing 2 bags of debt (-2 × -9) increases net balance by +18 units.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                Available in <strong>OpenDyslexic</strong> and <strong>ADHD Focus</strong> modes.
              </span>
              <a
                href="#diagnostic"
                onClick={() => setIsVideoModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1BBC7E] text-white hover:opacity-90 transition"
              >
                Try Full Diagnostic &rarr;
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

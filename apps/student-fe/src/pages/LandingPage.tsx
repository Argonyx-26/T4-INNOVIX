import React, { useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Zap, 
  Play, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Brain, 
  Flame, 
  BarChart3, 
  BookOpenCheck, 
  X, 
  Library,
  GraduationCap,
  ShieldCheck,
  Check
} from "lucide-react";
import { TrustStrip } from "../components/TrustStrip";
import { CourseCard } from "../components/CourseCard";
import { FinalCTA } from "../components/FinalCTA";
import { MOCK_COURSES } from "../data/mockCourses";
import { Course } from "../types";
import { useThemeMode } from "../context/ThemeModeContext";

interface LandingPageProps {
  onSelectCourse: (course: Course) => void;
  onNavigate: (hash: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectCourse, onNavigate }) => {
  const { mode, setMode, speak, stopSpeech } = useThemeMode();
  const [demoSelectedOption, setDemoSelectedOption] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Top 3 curated courses for landing showcase
  const topCourses = MOCK_COURSES.slice(0, 3);

  const handleToggleDyslexic = () => {
    if (mode === "dyslexic") {
      setMode("normal");
    } else {
      setMode("dyslexic");
    }
  };

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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#141416] transition-colors duration-200">
      {/* =========================================================================
          HERO SECTION — Designed with exact aesthetic from user's attached image
          ========================================================================= */}
      <section className="relative pt-6 sm:pt-10 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column: Hero Content with concise, accessible copy */}
            <div className="lg:col-span-6 space-y-6 z-10">
              
              {/* Graphic Capsule Status Pills (Direct from Reference Image) */}
              <div className="flex items-center space-x-2">
                <div className="w-12 h-6 rounded-full bg-[#111111] dark:bg-white shadow-sm" />
                <div className="w-6 h-6 rounded-full bg-[#10B981] shadow-sm" />
                <div className="w-4 h-6 rounded-full bg-[#10B981] shadow-sm" />
                <div className="w-10 h-6 rounded-full bg-[#10B981] shadow-sm" />
                <span className="ml-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  LEARN WITHOUT LIMITS
                </span>
              </div>

              {/* Bold, Accessible Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#111111] dark:text-white leading-[1.1] tracking-tight">
                Learning that fits{" "}
                <span className="relative inline-block text-[#10B981] underline decoration-[#FACC15] decoration-wavy decoration-2">
                  your mind.
                </span>
              </h1>

              {/* Short, Bite-Sized Subtitle (Lesser Text Content) */}
              <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-xl font-medium">
                Eduvia diagnoses the <strong>root misconception</strong> behind wrong answers — not just right or wrong. Tailored for <strong>Standard</strong>, <strong>ADHD</strong>, and <strong>Dyslexic</strong> learners.
              </p>

              {/* Action Pill Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {/* Primary Pill Button */}
                <a
                  href="#diagnostic"
                  className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-full font-bold text-sm bg-[#111111] dark:bg-white text-white dark:text-[#111111] hover:bg-[#FACC15] hover:text-[#111111] dark:hover:bg-[#FACC15] dark:hover:text-[#111111] shadow-md transition-all transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-[#FACC15] group-hover:text-black" />
                  <span>Start Free Diagnostic</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </a>

                {/* Direct OpenDyslexic Font Toggle Button */}
                <button
                  onClick={handleToggleDyslexic}
                  className={`inline-flex items-center space-x-2 px-5 py-3.5 rounded-full font-semibold text-sm transition-all border shadow-sm ${
                    mode === "dyslexic"
                      ? "bg-[#10B981] text-white border-[#10B981]"
                      : "bg-white dark:bg-[#1E1E24] text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-[#10B981]"
                  }`}
                  title="Toggle OpenDyslexic Weighted Font"
                >
                  <BookOpenCheck className="w-4 h-4" />
                  <span>{mode === "dyslexic" ? "OpenDyslexic Font: ON" : "OpenDyslexic Font"}</span>
                  {mode === "dyslexic" && <Check className="w-3.5 h-3.5 ml-1" />}
                </button>

                {/* Text-to-Speech Audio Assist */}
                <button
                  onClick={handleReadAloudHero}
                  className="p-3.5 rounded-full bg-white dark:bg-[#1E1E24] text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:text-[#10B981] hover:border-[#10B981] shadow-sm transition"
                  title="Listen to summary"
                >
                  {isPlayingAudio ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Feature Chips (Concise Visual Proof) */}
              <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  ⚡ 3-Tier Scaffolded Hints
                </span>
                <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  🗺️ Prerequisite Mind Maps
                </span>
                <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  🤖 Teacher RAG Vector AI
                </span>
              </div>
            </div>

            {/* Right Column: Hero Visual Artwork matching attached image with interactive hotspots */}
            <div className="lg:col-span-6 relative flex justify-center items-center">
              <div className="relative w-full max-w-xl group">
                
                {/* Hero Illustration Container with crisp border and subtle lift */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-black/10 dark:border-white/10 bg-white">
                  <img
                    src="/hero-illustration.jpg"
                    alt="Eduvia Adaptive Learning Illustration with Student, Playful Badges, and Classroom Preview"
                    className="w-full h-auto object-cover select-none"
                    loading="eager"
                  />

                  {/* Interactive Hotspot: Classroom Video Preview Card (Bottom Center) */}
                  <div 
                    onClick={() => setIsVideoModalOpen(true)}
                    className="absolute bottom-[4%] left-[34%] w-[33%] h-[26%] rounded-full cursor-pointer hover:ring-4 hover:ring-emerald-400/50 transition-all flex items-center justify-center group/vid"
                    title="Click to watch 45-second micro-lesson video preview"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white group-hover/vid:scale-110 group-hover/vid:bg-[#10B981] transition-transform shadow-lg">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 fill-current" />
                    </div>
                  </div>

                  {/* Interactive Hotspot: Top-Right Stacked Pill List */}
                  <div 
                    onClick={() => onNavigate("#courses")}
                    className="absolute top-[16%] right-[5%] w-[16%] h-[20%] cursor-pointer hover:opacity-90 transition"
                    title="Explore Course Curriculum"
                  />

                  {/* Interactive Hotspot: Floating White Card */}
                  <div 
                    onClick={() => onNavigate("#diagnostic")}
                    className="absolute top-[45%] right-[7%] w-[20%] h-[15%] cursor-pointer hover:opacity-90 transition"
                    title="Launch Cognitive Diagnostic Challenge"
                  />

                  {/* Interactive Hotspot: Connected Circles ooooo */}
                  <div 
                    onClick={() => onNavigate("#paths")}
                    className="absolute bottom-[6%] right-[6%] w-[22%] h-[8%] cursor-pointer hover:opacity-90 transition"
                    title="5-Stage Learning Progression Paths"
                  />
                </div>

                {/* Floating Micro-Badge Indicator */}
                <div className="absolute -bottom-4 -left-4 bg-white dark:bg-[#1E1E24] px-4 py-2.5 rounded-2xl shadow-xl border border-black/10 dark:border-white/10 flex items-center space-x-2.5 animate-bounce duration-1000">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    98.4% Diagnostic Accuracy
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          TRUST STRIP — Single-Line Metrics
          ========================================================================= */}
      <TrustStrip />

      {/* =========================================================================
          SECTION 2 — The 3-Step Cognitive Loop (Chunked, Minimal Text)
          ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
            HOW IT WORKS
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#111111] dark:text-white mt-1">
            Diagnose the Thinking, Not Just the Answer
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm hover:border-[#10B981] transition">
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
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm hover:border-[#FACC15] transition">
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
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm hover:border-[#10B981] transition">
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
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="rounded-3xl bg-white dark:bg-[#1E1E24] p-6 sm:p-8 border border-black/10 dark:border-white/10 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
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
              onClick={() => setDemoSelectedOption("x=2")}
              className={`p-3.5 rounded-2xl font-semibold text-sm border transition text-left flex items-center justify-between ${
                demoSelectedOption === "x=2"
                  ? "bg-rose-500 text-white border-rose-500"
                  : "bg-neutral-100 dark:bg-white/5 border-transparent text-neutral-800 dark:text-neutral-200 hover:border-neutral-300"
              }`}
            >
              <span>x = 2 (Common Misstep)</span>
              <span className="text-xs opacity-75">&rarr;</span>
            </button>

            <button
              onClick={() => setDemoSelectedOption("x=5")}
              className={`p-3.5 rounded-2xl font-semibold text-sm border transition text-left flex items-center justify-between ${
                demoSelectedOption === "x=5"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-neutral-100 dark:bg-white/5 border-transparent text-neutral-800 dark:text-neutral-200 hover:border-neutral-300"
              }`}
            >
              <span>x = 5 (Correct Root)</span>
              <span className="text-xs opacity-75">&check;</span>
            </button>
          </div>

          {demoSelectedOption === "x=2" && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs animate-in fade-in">
              <strong className="text-rose-700 dark:text-rose-400 block mb-1">
                ⚠️ Sign Inversion Detected:
              </strong>
              <p className="text-neutral-700 dark:text-neutral-300">
                Multiplying -2 by -9 yields <strong>+18</strong>, not -18. Debt cancellation rule: subtracting negative units adds positive value!
              </p>
            </div>
          )}

          {demoSelectedOption === "x=5" && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs animate-in fade-in">
              <strong className="text-emerald-700 dark:text-emerald-400 block mb-1">
                ✓ Correct Algebraic Expansion:
              </strong>
              <p className="text-neutral-700 dark:text-neutral-300">
                -2x + 18 = 14 &rarr; -2x = -4 &rarr; x = 2? No, if x=5: -2(5 - 9) = -2(-4) = 8.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 4 — Curated Multi-Tier Courses (Concise Cards)
          ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B981]">
              UNIVERSAL CATALOG
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#111111] dark:text-white mt-1">
              School, College &amp; Professional Tracks
            </h2>
          </div>
          <a
            href="#courses"
            className="mt-3 sm:mt-0 inline-flex items-center space-x-1.5 font-bold text-sm text-[#10B981] hover:underline"
          >
            <span>Explore All Courses</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topCourses.map((c) => (
            <CourseCard key={c.id} course={c} onSelect={onSelectCourse} />
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 5 — Final Call to Action
          ========================================================================= */}
      <FinalCTA />

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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#10B981] text-white hover:opacity-90 transition"
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

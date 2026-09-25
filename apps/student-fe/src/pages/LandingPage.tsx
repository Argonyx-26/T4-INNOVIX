import React, { useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Zap, 
  Shield, 
  Brain, 
  BarChart, 
  Flame, 
  BookOpen, 
  Eye, 
  Volume2, 
  Compass, 
  Layers 
} from "lucide-react";
import { TrustStrip } from "../components/TrustStrip";
import { CourseCard } from "../components/CourseCard";
import { Testimonial } from "../components/Testimonial";
import { FinalCTA } from "../components/FinalCTA";
import { MOCK_COURSES } from "../data/mockCourses";
import { Course } from "../types";
import { useThemeMode } from "../context/ThemeModeContext";

interface LandingPageProps {
  onSelectCourse: (course: Course) => void;
  onNavigate: (hash: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectCourse, onNavigate }) => {
  const { mode, setMode, speak } = useThemeMode();
  const [demoSelectedOption, setDemoSelectedOption] = useState<string | null>(null);

  // Take top 3 curated courses for landing showcase
  const topCourses = MOCK_COURSES.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Editorial Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              {/* Live Status Badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>• LEARN WITHOUT LIMITS</span>
              </div>

              {/* Editorial Headline */}
              <h1 className="text-4xl sm:text-6xl font-display font-bold text-[#141414] dark:text-white leading-[1.1] tracking-tight">
                Don't just detect the wrong answer.{" "}
                <span className="relative inline-block text-[#8266F0]">
                  Diagnose the wrong thinking.
                  <svg
                    className="absolute -bottom-2 left-0 w-full text-[#EC4899]/50 -z-10"
                    viewBox="0 0 300 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 9C50 3 150 1 299 10"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#6B6B6B] dark:text-slate-300 leading-relaxed max-w-xl">
                Eduvia (powered by <strong>LearnLens AI</strong>) is a universal cognitive diagnostic &amp; teacher intelligence system spanning <strong>School (K-12)</strong>, <strong>Undergraduate (UG)</strong>, and <strong>Postgraduate (PG)</strong> across STEM, Computer Science, Medicine, and Finance.
              </p>

              {/* Dual Primary Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="#diagnostic"
                  className="inline-flex items-center justify-center space-x-2 px-7 py-4 rounded-2xl font-bold text-sm bg-[#141414] dark:bg-white text-white dark:text-[#141414] hover:opacity-90 shadow-lg shadow-black/10 transition transform active:scale-95 text-center"
                >
                  <Sparkles className="w-4 h-4 text-[#8266F0]" />
                  <span>Launch AI Diagnostic Loop</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </a>

                <a
                  href="#courses"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl font-semibold text-sm bg-white dark:bg-[#1E1E24] text-[#141414] dark:text-white border border-black/10 dark:border-white/10 hover:border-[#8266F0] transition text-center shadow-sm"
                >
                  <BookOpen className="w-4 h-4 text-[#EC4899]" />
                  <span>Explore Curriculum</span>
                </a>
              </div>

              {/* Trust Social Proof Cluster */}
              <div className="pt-4 flex items-center space-x-4">
                <div className="flex -space-x-2 overflow-hidden">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
                  ].map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Student Avatar"
                      className="inline-block h-9 w-9 rounded-full ring-2 ring-white dark:ring-[#17171B] object-cover"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center space-x-1 text-xs font-bold text-[#141414] dark:text-white">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>4.9/5 Student Rating</span>
                  </div>
                  <div className="text-[11px] text-[#6B6B6B] dark:text-slate-400">
                    Over 50,000 multi-tier cognitive misconceptions cleared
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Diagnostic Preview Card & Neurodivergent Demo */}
            <div className="lg:col-span-5 space-y-6">
              {/* Interactive Live Diagnostic Preview Card */}
              <div className="relative rounded-3xl bg-white dark:bg-[#1E1E24] p-6 sm:p-7 border border-black/10 dark:border-white/10 shadow-xl editorial-shadow">
                <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8266F0]">
                      Live Cognitive Telemetry
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-500">
                    Class 9 Math
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-[#6B6B6B] dark:text-slate-400">Sample Diagnostic Problem:</p>
                  <div className="mt-1 p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 font-mono font-bold text-lg text-center text-[#141414] dark:text-white">
                    4(2x - 3) = -2(x - 9)
                  </div>
                </div>

                {/* Quick Misstep Simulation */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-[#141414] dark:text-white">
                    Select an answer to see instant cognitive diagnosis:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: "x = 3", label: "x = 3 (Common Misstep)" },
                      { val: "x = 5", label: "x = 5 (Correct Root)" },
                    ].map((btn) => (
                      <button
                        key={btn.val}
                        onClick={() => setDemoSelectedOption(btn.val)}
                        className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition ${
                          demoSelectedOption === btn.val
                            ? "bg-[#8266F0] text-white border-[#8266F0]"
                            : "bg-black/5 dark:bg-white/5 border-transparent text-[#141414] dark:text-slate-300 hover:border-black/10"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  {demoSelectedOption === "x = 3" && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs animate-in fade-in duration-150">
                      <span className="font-bold text-rose-700 dark:text-rose-400 block mb-0.5">
                        ⚠️ Sign Inversion Detected:
                      </span>
                      <p className="text-[#6B6B6B] dark:text-slate-300 leading-snug">
                        Multiplying -2 by -9 was calculated as -18 instead of +18. Notice the debt cancellation rule: two minuses cancel out!
                      </p>
                    </div>
                  )}

                  {demoSelectedOption === "x = 5" && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs animate-in fade-in duration-150">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                        ✓ Correct Expansion:
                      </span>
                      <p className="text-[#6B6B6B] dark:text-slate-300 leading-snug">
                        8x - 12 = -2x + 18. Both sides balanced perfectly.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-[#6B6B6B] dark:text-slate-400">
                    60-second micro-intervention engine
                  </span>
                  <a
                    href="#diagnostic"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-[#8266F0] hover:text-[#EC4899] transition"
                  >
                    <span>Full 5-Stage Assessment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Adaptive Neurodivergent Showcase Card */}
              <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-indigo-500/10 p-5 border border-black/5 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-white dark:bg-[#1E1E24] text-[#8266F0] shadow-sm">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#141414] dark:text-white uppercase tracking-wider">
                      Adaptive Neurodivergent UI
                    </h4>
                    <p className="text-xs text-[#6B6B6B] dark:text-slate-300">
                      Seamlessly toggle ADHD Focus & Dyslexia reading ruler modes anytime.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setMode(mode === "adhd" ? "dyslexic" : mode === "dyslexic" ? "normal" : "adhd")}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1E1E24] text-[#141414] dark:text-white shadow-sm hover:bg-black/5 transition border border-black/5"
                >
                  Try Switch
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <TrustStrip />

      {/* Top Curated Courses Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8266F0]">
              Curated Curriculum
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-display font-bold text-[#141414] dark:text-white">
              Targeted modules with misconception protection
            </h2>
          </div>

          <a
            href="#courses"
            className="mt-4 md:mt-0 inline-flex items-center space-x-1.5 font-bold text-sm text-[#8266F0] hover:text-[#EC4899] transition"
          >
            <span>View All 450+ Modules</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {topCourses.map((c) => (
            <CourseCard key={c.id} course={c} onSelect={onSelectCourse} />
          ))}
        </div>
      </section>

      {/* Feature Matrix Pillars */}
      <section className="py-20 bg-white/70 dark:bg-white/5 border-y border-black/5 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#EC4899]">
              How LearnLens Works
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-display font-bold text-[#141414] dark:text-white">
              The 4 Pillars of Adaptive Learning
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Brain,
                title: "Cognitive Misconception Detection",
                desc: "Analyzes student response latencies and incorrect options to uncover the precise mental model breakdown.",
                color: "text-violet-500",
                bg: "bg-violet-500/10",
              },
              {
                icon: Flame,
                title: "Adaptive Dynamic Pacing",
                desc: "Bypasses already-mastered drills. Accelerates student velocity while reinforcing fragile prerequisite chains.",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
              {
                icon: Volume2,
                title: "Multimodal Accessibility",
                desc: "Integrated Web Speech API speech-to-text voice coach and text-to-speech reading ruler for dyslexic learners.",
                color: "text-rose-500",
                bg: "bg-rose-500/10",
              },
              {
                icon: BarChart,
                title: "Teacher Cohort Telemetry",
                desc: "Real-time class heatmaps pinpointing which concepts 15+ students stumble on, generating 5-minute reteaching plans.",
                color: "text-teal-500",
                bg: "bg-teal-500/10",
              },
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition"
                >
                  <div className={`w-12 h-12 rounded-2xl ${p.bg} ${p.color} flex items-center justify-center mb-6`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#141414] dark:text-white mb-2 leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#6B6B6B] dark:text-slate-300 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Verified Testimonials */}
      <Testimonial />

      {/* Closing Call to Action */}
      <FinalCTA />
    </div>
  );
};

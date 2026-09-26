import React from "react";
import { Sparkles, ArrowRight, Zap, ShieldCheck } from "lucide-react";

export const FinalCTA: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-[#17171B] via-[#241f38] to-[#17171B] text-white p-10 sm:p-16 relative overflow-hidden shadow-2xl border border-white/10">
        {/* Glow ambient background lights */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#EC4899]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15 mb-6">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>60-Second Cognitive Clearance</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-white leading-tight">
            Stop guessing your mistakes. Start mastering them.
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Take the free 3-minute diagnostic. Uncover your hidden prerequisite gaps before next week&apos;s exam with our adaptive AI coach.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <a
              href="#diagnostic"
              className="inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand to-[#EC4899] hover:opacity-95 text-white shadow-lg shadow-brand/30 transition transform active:scale-95 text-center"
            >
              <span>Launch Free AI Diagnostic</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#courses"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl font-semibold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/15 transition text-center"
            >
              Browse CBSE / ICSE Syllabus
            </a>
          </div>

          <div className="mt-8 flex items-center space-x-6 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-brand" />
              <span>Instant visual report</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

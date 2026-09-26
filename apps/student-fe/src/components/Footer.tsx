import React from "react";
import { Sparkles, Heart, Shield, Accessibility, Terminal } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-black/5 bg-fill-2 dark:bg-[#121215] text-[#141414] dark:text-white pt-14 pb-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand to-[#EC4899] flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-xl text-[#141414] dark:text-white">
                Eduvia
              </span>
            </div>
            <p className="text-xs text-[#6B6B6B] dark:text-slate-400 leading-relaxed">
              Moving beyond binary grading. Powered by LearnLens Cognitive Diagnostics to turn student misconceptions into lasting mathematical breakthroughs.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-[#6B6B6B] dark:text-slate-400">
              <Accessibility className="w-4 h-4 text-brand" />
              <span>WCAG 2.1 AA Compliant • Neurodivergent Certified</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[#141414] dark:text-white">Platform</h4>
            <ul className="space-y-2.5 text-xs text-[#6B6B6B] dark:text-slate-400">
              <li><a href="#home" className="hover:text-brand transition">Home & Overview</a></li>
              <li><a href="#diagnostic" className="hover:text-brand transition">AI Diagnostic Loop</a></li>
              <li><a href="#courses" className="hover:text-brand transition">Curriculum Explorer</a></li>
              <li><a href="#pacing" className="hover:text-brand transition">Adaptive Velocity</a></li>
              <li><a href="#paths" className="hover:text-brand transition">5-Stage Learning Path</a></li>
            </ul>
          </div>

          {/* Educators & Schools */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[#141414] dark:text-white">Educators</h4>
            <ul className="space-y-2.5 text-xs text-[#6B6B6B] dark:text-slate-400">
              <li><a href="#teacher" className="hover:text-brand transition">Cohort Misconception Heatmap</a></li>
              <li><a href="#mentors" className="hover:text-brand transition">Faculty Directory</a></li>
              <li><a href="#pacing" className="hover:text-brand transition">Laboratory Simulators</a></li>
              <li><span className="opacity-50">Class 8–10 CBSE / ICSE Mapping</span></li>
            </ul>
          </div>

          {/* Technology & Telemetry */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[#141414] dark:text-white">Architecture</h4>
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl space-y-2 border border-black/5 dark:border-white/10">
              <div className="flex items-center space-x-2 text-xs font-mono text-brand">
                <Terminal className="w-3.5 h-3.5" />
                <span>LearnLens Engine v2.0</span>
              </div>
              <p className="text-[11px] text-[#6B6B6B] dark:text-slate-400 leading-normal">
                Sub-millisecond behavioral ML, Item Response Theory, and Gemini 1.5 diagnostic reasoning.
              </p>
              <div className="pt-2 flex items-center space-x-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Zero Binary Failures</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-black/5 dark:border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B6B6B] dark:text-slate-400">
          <p>© 2026 Eduvia & LearnLens AI. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Crafted for neurodivergent & curious minds with</span>
            <Heart className="w-3.5 h-3.5 text-[#EC4899] fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
};

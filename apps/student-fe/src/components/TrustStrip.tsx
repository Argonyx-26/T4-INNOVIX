import React from "react";
import { Users, BookOpen, GraduationCap, Award, CheckCircle } from "lucide-react";

export const TrustStrip: React.FC = () => {
  const stats = [
    { label: "Active Learners", value: "25,000+", icon: Users, sub: "Class 8–10 Students" },
    { label: "Curated Modules", value: "450+", icon: BookOpen, sub: "CBSE & ICSE Aligned" },
    { label: "Expert Instructors", value: "120+", icon: GraduationCap, sub: "IIT, MIT & Stanford" },
    { label: "Recovery Satisfaction", value: "94%", icon: Award, sub: "Misconceptions Cleared" },
  ];

  return (
    <section className="w-full py-10 border-y border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="flex items-center space-x-3.5 p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#8266F0]/10 dark:bg-[#8266F0]/20 text-[#8266F0] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-display text-[#141414] dark:text-white tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-xs font-semibold text-[#141414] dark:text-slate-200">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-[#6B6B6B] dark:text-slate-400">
                    {s.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

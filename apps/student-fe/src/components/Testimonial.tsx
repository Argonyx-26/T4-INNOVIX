import React from "react";
import { Quote, CheckCircle2, Star } from "lucide-react";

export const Testimonial: React.FC = () => {
  const reviews = [
    {
      quote: "Before LearnLens, I thought my daughter was just bad at algebra. In 60 seconds, the AI diagnosed that she was inverting negative signs when distributing. She went from 52% to 89% in her term exam!",
      author: "Sunita Deshmukh",
      role: "Parent of Class 9 Student",
      school: "The Heritage School, Gurgaon",
      rating: 5,
    },
    {
      quote: "The Cohort Misconception Heatmap revolutionized my morning lesson plans. I no longer waste 40 minutes reviewing concepts 80% of the class already knows. I target the exact 3 trap questions.",
      author: "Rajesh Kannan",
      role: "Senior Mathematics HOD",
      school: "Delhi Public School, R.K. Puram",
      rating: 5,
    },
    {
      quote: "ADHD Focus Mode keeps my screen calm without noisy popups. The Debt Cancellation rule for multiplying negative numbers finally made sense because of the visual grid.",
      author: "Aditya Verma",
      role: "Class 10 Student",
      school: "Bombay Scottish School",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-[#EFEFEE] dark:bg-[#17171B] border-t border-black/5 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8266F0]">
            Verified Impact Stories
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-display font-bold text-[#141414] dark:text-white">
            From cognitive confusion to lasting mathematical clarity
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between p-8 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm"
            >
              <div>
                <div className="flex items-center space-x-1 text-amber-400 mb-4">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-[#141414] dark:text-slate-200 leading-relaxed italic">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/10 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#8266F0]/15 text-[#8266F0] flex items-center justify-center font-bold text-sm">
                  {rev.author[0]}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 font-semibold text-xs text-[#141414] dark:text-white">
                    <span>{rev.author}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
                  </div>
                  <div className="text-[11px] text-[#6B6B6B] dark:text-slate-400">
                    {rev.role} • {rev.school}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

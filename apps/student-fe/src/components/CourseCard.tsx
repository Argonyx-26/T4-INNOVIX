import React from "react";
import { Star, Clock, Bookmark, BookmarkCheck, ArrowRight, AlertTriangle, Volume2 } from "lucide-react";
import { Course } from "../types";
import { useThemeMode } from "../context/ThemeModeContext";

interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect }) => {
  const { bookmarks, toggleBookmark, mode, speak } = useThemeMode();
  const isBookmarked = bookmarks.includes(course.id);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="group relative flex flex-col justify-between bg-white dark:bg-[#1E1E24] rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-brand/30 transition-all duration-300">
      <div>
        {/* Top Badges & Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand/10 text-brand dark:bg-brand/25 dark:text-[#a794ff]">
              {course.grade}
            </span>
            {course.tier && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-200/70 dark:bg-white/10 text-neutral-800 dark:text-neutral-200">
                {course.tier}
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border flex items-center space-x-1 ${getRiskColor(course.misconceptionRisk)}`}>
              <AlertTriangle className="w-3 h-3" />
              <span>{course.misconceptionRisk} Risk</span>
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {mode === "dyslexic" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(`${course.title}. ${course.description}`);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-brand hover:bg-black/5 transition"
                title="Read aloud"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(course);
              }}
              className={`p-2 rounded-xl transition ${
                isBookmarked
                  ? "text-[#EC4899] bg-[#EC4899]/10"
                  : "text-slate-400 hover:text-[#141414] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              title={isBookmarked ? "Remove Bookmark" : "Save Course"}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="font-display font-bold text-lg text-[#141414] dark:text-white group-hover:text-brand transition-colors leading-snug">
          {course.title}
        </h3>
        <p className="adhd-hide mt-2 text-xs text-[#6B6B6B] dark:text-slate-300 leading-relaxed line-clamp-2">
          {course.description}
        </p>

        {/* Prerequisites */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {course.prerequisites.map((req, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[#6B6B6B] dark:text-slate-400"
            >
              Requires: {req}
            </span>
          ))}
        </div>
      </div>

      {/* Meta Footer & Inspect Trigger */}
      <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-[#6B6B6B] dark:text-slate-400">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 font-semibold text-[#141414] dark:text-white">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{course.rating}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{course.duration.split("•")[0]}</span>
          </div>
        </div>

        <button
          onClick={() => onSelect(course)}
          className="inline-flex items-center space-x-1 font-semibold text-brand hover:text-[#EC4899] transition-colors"
        >
          <span>Syllabus</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

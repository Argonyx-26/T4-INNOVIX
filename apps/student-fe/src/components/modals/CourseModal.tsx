import React, { useEffect } from "react";
import { X, Star, Clock, AlertTriangle, CheckCircle, Bookmark, BookmarkCheck, Users, PlayCircle } from "lucide-react";
import { Course } from "../../types";
import { useThemeMode } from "../../context/ThemeModeContext";

interface CourseModalProps {
  course: Course | null;
  onClose: () => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({ course, onClose }) => {
  const { bookmarks, toggleBookmark, showToast } = useThemeMode();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && course) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [course, onClose]);

  if (!course) return null;

  const isBookmarked = bookmarks.includes(course.id);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-[#1E1E24] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden transform animate-in zoom-in-95 duration-150 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-brand/10 via-[#EC4899]/5 to-transparent border-b border-black/5 dark:border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand text-white">
                {course.grade}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/5 dark:bg-white/10 text-[#141414] dark:text-white">
                {course.category}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-[#141414] dark:hover:text-white hover:bg-black/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="mt-4 font-display font-bold text-2xl sm:text-3xl text-[#141414] dark:text-white leading-tight">
            {course.title}
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#6B6B6B] dark:text-slate-300">
            <div className="flex items-center space-x-1 font-semibold text-[#141414] dark:text-white">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{course.rating} ({course.enrolledStudents.toLocaleString()} students)</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center space-x-1 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Misconception Risk: {course.misconceptionRisk}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-sm text-[#141414] dark:text-white mb-2">About this Course</h3>
            <p className="text-sm text-[#6B6B6B] dark:text-slate-300 leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Instructor Block */}
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center space-x-4">
            <img
              src={course.instructor.avatar}
              alt={course.instructor.name}
              className="w-12 h-12 rounded-2xl object-cover"
            />
            <div>
              <div className="font-bold text-sm text-[#141414] dark:text-white">
                {course.instructor.name}
              </div>
              <div className="text-xs text-[#6B6B6B] dark:text-slate-400">
                {course.instructor.role}
              </div>
            </div>
          </div>

          {/* Syllabus Modules */}
          <div>
            <h3 className="font-semibold text-sm text-[#141414] dark:text-white mb-3">
              Course Syllabus ({course.modules.length} Modules)
            </h3>
            <div className="space-y-3">
              {course.modules.map((mod, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#25252D]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-[#141414] dark:text-white">
                      {mod.title}
                    </span>
                    <span className="text-xs text-[#6B6B6B] dark:text-slate-400">
                      {mod.duration}
                    </span>
                  </div>
                  <ul className="space-y-1.5 pl-2">
                    {mod.lessons.map((lesson, lIdx) => (
                      <li key={lIdx} className="text-xs text-[#6B6B6B] dark:text-slate-300 flex items-center space-x-2">
                        <PlayCircle className="w-3.5 h-3.5 text-brand" />
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-black/5 dark:bg-white/5 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
          <button
            onClick={() => toggleBookmark(course)}
            className="flex items-center space-x-2 text-sm font-semibold text-[#141414] dark:text-white hover:text-brand transition"
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-[#EC4899]" />
                <span>Saved in Queue</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Save Course</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              showToast("Enrolled Successfully!", `You have enrolled in ${course.title}. Progress synced.`, "success");
              onClose();
            }}
            className="px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand to-[#EC4899] hover:opacity-95 text-white shadow-lg shadow-brand/25 transition"
          >
            Enroll & Start Learning
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Search, X, BookOpen, Sparkles, User, ArrowRight, CornerDownLeft, Library, ExternalLink } from "lucide-react";
import { MOCK_COURSES } from "../../data/mockCourses";
import { MOCK_INSTRUCTORS } from "../../data/mockInstructors";
import { MOCK_EDUCATIONAL_RESOURCES } from "../../data/mockResources";
import { Course, EducationalResource } from "../../types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourse: (course: Course) => void;
  onNavigate: (hash: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCourse,
  onNavigate,
}) => {
  const [query, setQuery] = useState("");

  // Cmd+K hotkey & Escape key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Toggle search modal can be managed by parent or local
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCourses = MOCK_COURSES.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase()) ||
      c.grade.toLowerCase().includes(query.toLowerCase()) ||
      (c.discipline && c.discipline.toLowerCase().includes(query.toLowerCase())) ||
      (c.tier && c.tier.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredResources = MOCK_EDUCATIONAL_RESOURCES.filter(
    (res: EducationalResource) =>
      res.title.toLowerCase().includes(query.toLowerCase()) ||
      res.summary.toLowerCase().includes(query.toLowerCase()) ||
      res.matchedMisconception.toLowerCase().includes(query.toLowerCase()) ||
      res.source.toLowerCase().includes(query.toLowerCase())
  );

  const filteredInstructors = MOCK_INSTRUCTORS.filter(
    (ins) =>
      ins.name.toLowerCase().includes(query.toLowerCase()) ||
      ins.credentials.toLowerCase().includes(query.toLowerCase()) ||
      ins.specialization.some((s) => s.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 p-4 modal-backdrop animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#1E1E24] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden transform animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-6 py-4 border-b border-black/5 dark:border-white/10">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, instructors, sign traps, or topics..."
            className="w-full text-base bg-transparent text-[#141414] dark:text-white placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-slate-400 hover:text-[#141414] transition mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-2 py-1 rounded bg-black/5 dark:bg-white/10 text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Quick Diagnostic Shortcut */}
        <div className="p-4 bg-[#8266F0]/5 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-medium text-[#8266F0]">
            <Sparkles className="w-4 h-4" />
            <span>Looking for immediate misconception clearance?</span>
          </div>
          <button
            onClick={() => {
              onNavigate("#diagnostic");
              onClose();
            }}
            className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#8266F0] text-white hover:opacity-90 transition"
          >
            Launch Diagnostic Loop
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
          {/* Courses Category */}
          {filteredCourses.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#6B6B6B] dark:text-slate-400 uppercase tracking-wider px-2 mb-2">
                Courses ({filteredCourses.length})
              </div>
              <div className="space-y-1.5">
                {filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCourse(c);
                      onClose();
                    }}
                    className="p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-black/5 dark:bg-white/10 text-[#8266F0]">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#141414] dark:text-white group-hover:text-[#8266F0] transition">
                          {c.title}
                        </div>
                        <div className="text-xs text-[#6B6B6B] dark:text-slate-400">
                          {c.grade} • {c.duration}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#8266F0] group-hover:translate-x-1 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources Category */}
          {filteredResources.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#6B6B6B] dark:text-slate-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                <span>Vetted Educational Resources ({filteredResources.length})</span>
                <button
                  onClick={() => {
                    onNavigate("#library");
                    onClose();
                  }}
                  className="text-[10px] text-[#8266F0] hover:underline"
                >
                  View Library
                </button>
              </div>
              <div className="space-y-1.5">
                {filteredResources.slice(0, 4).map((r: EducationalResource) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      onNavigate("#library");
                      onClose();
                    }}
                    className="p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Library className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#141414] dark:text-white group-hover:text-[#8266F0] transition">
                          {r.title}
                        </div>
                        <div className="text-xs text-[#6B6B6B] dark:text-slate-400">
                          {r.source} • {r.type} • {r.matchedMisconception}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#8266F0] group-hover:translate-x-1 transition" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructors Category */}
          {filteredInstructors.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#6B6B6B] dark:text-slate-400 uppercase tracking-wider px-2 mb-2">
                Faculty ({filteredInstructors.length})
              </div>
              <div className="space-y-1.5">
                {filteredInstructors.map((ins) => (
                  <div
                    key={ins.id}
                    onClick={() => {
                      onNavigate("#mentors");
                      onClose();
                    }}
                    className="p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={ins.avatar}
                        alt={ins.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-sm text-[#141414] dark:text-white group-hover:text-[#8266F0] transition">
                          {ins.name}
                        </div>
                        <div className="text-xs text-[#6B6B6B] dark:text-slate-400">
                          {ins.credentials}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#8266F0]">View Profile</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredCourses.length === 0 && filteredInstructors.length === 0 && filteredResources.length === 0 && (
            <div className="py-12 text-center text-[#6B6B6B] dark:text-slate-400 text-sm">
              No matching courses, resources, or mentors found for &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

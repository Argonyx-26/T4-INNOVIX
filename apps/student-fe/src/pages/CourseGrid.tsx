import React, { useState, useEffect, useMemo } from "react";
import { Course } from "../types";
import { dataService } from "../services/dataService";
import { CourseCard } from "../components/CourseCard";
import { useThemeMode } from "../context/ThemeModeContext";
import { Search, Filter, Bookmark, Sparkles, BookOpen, Layers, CheckCircle2, Loader2 } from "lucide-react";

interface CourseGridProps {
  onSelectCourse: (course: Course) => void;
}

type FilterCategory = "All" | "School (K-12)" | "Undergraduate (UG)" | "Postgraduate (PG)" | "Foundations" | "Advanced" | "Bookmarked";

export const CourseGrid: React.FC<CourseGridProps> = ({ onSelectCourse }) => {
  const { bookmarks, mode } = useThemeMode();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTier, setActiveTier] = useState<string>("All");
  const [activeDiscipline, setActiveDiscipline] = useState<string>("All");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("All");

  useEffect(() => {
    dataService.getCourses().then((data) => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  const filterOptions: FilterCategory[] = [
    "All",
    "School (K-12)",
    "Undergraduate (UG)",
    "Postgraduate (PG)",
    "Foundations",
    "Advanced",
    "Bookmarked",
  ];

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      // Tier Filter
      if (activeTier !== "All" && course.tier !== activeTier) return false;

      // Discipline Filter
      if (activeDiscipline !== "All" && course.discipline !== activeDiscipline) return false;

      // Pill Filter
      if (activeFilter === "School (K-12)" && course.tier !== "School (K-12)") return false;
      if (activeFilter === "Undergraduate (UG)" && course.tier !== "Undergraduate (UG)") return false;
      if (activeFilter === "Postgraduate (PG)" && course.tier !== "Postgraduate (PG)") return false;
      if (activeFilter === "Foundations" && course.category !== "Foundations") return false;
      if (activeFilter === "Advanced" && course.category !== "Advanced") return false;
      if (activeFilter === "Bookmarked" && !bookmarks.includes(course.id)) return false;

      // Risk Filter
      if (riskFilter !== "All" && course.misconceptionRisk !== riskFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = course.title.toLowerCase().includes(query);
        const matchDesc = course.description.toLowerCase().includes(query);
        const matchPrereq = course.prerequisites.some((p) => p.toLowerCase().includes(query));
        const matchInstructor = course.instructor.name.toLowerCase().includes(query);
        const matchTier = course.tier ? course.tier.toLowerCase().includes(query) : false;
        const matchDiscipline = course.discipline ? course.discipline.toLowerCase().includes(query) : false;
        return matchTitle || matchDesc || matchPrereq || matchInstructor || matchTier || matchDiscipline;
      }

      return true;
    });
  }, [activeTier, activeDiscipline, activeFilter, riskFilter, searchQuery, bookmarks]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#8266F0]/10 text-[#8266F0] font-semibold text-xs tracking-wider uppercase mb-4 border border-[#8266F0]/20">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Universal Multi-Tier Cognitive Curriculum</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-display mb-4">
          Curriculum Explorer
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed">
          Structured conceptual progressions designed to prevent and clear misconceptions across School (K-12), Undergraduate (UG), and Postgraduate (PG) disciplines. Every course links directly with our real-time cognitive telemetry loop.
        </p>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          <div className="p-3 bg-white dark:bg-[#1E1E24] rounded-2xl border border-black/5 dark:border-white/10 shadow-sm text-center">
            <div className="text-2xl font-bold text-neutral-900 dark:text-white font-display">600+</div>
            <div className="text-xs text-neutral-500 font-medium">Curated Modules</div>
          </div>
          <div className="p-3 bg-white dark:bg-[#1E1E24] rounded-2xl border border-black/5 dark:border-white/10 shadow-sm text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display">100%</div>
            <div className="text-xs text-neutral-500 font-medium">Diagnostic-Mapped</div>
          </div>
          <div className="p-3 bg-white dark:bg-[#1E1E24] rounded-2xl border border-black/5 dark:border-white/10 shadow-sm text-center">
            <div className="text-2xl font-bold text-[#8266F0] font-display">3 Modes</div>
            <div className="text-xs text-neutral-500 font-medium">Neurodivergent Ready</div>
          </div>
          <div className="p-3 bg-white dark:bg-[#1E1E24] rounded-2xl border border-black/5 dark:border-white/10 shadow-sm text-center">
            <div className="text-2xl font-bold text-amber-500 font-display">{bookmarks.length}</div>
            <div className="text-xs text-neutral-500 font-medium">Saved to Your Plan</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-4 sm:p-6 border border-black/5 dark:border-white/10 shadow-sm mb-8 space-y-4">
        {/* Search input & Discipline/Risk dropdowns */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by topic, prerequisite, formula, tier, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8266F0] text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            {/* Discipline Filter */}
            <select
              value={activeDiscipline}
              onChange={(e) => setActiveDiscipline(e.target.value)}
              className="px-3.5 py-3 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
            >
              <option value="All">All Disciplines</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Medicine & Physiology">Medicine & Physiology</option>
              <option value="Commerce & Finance">Commerce & Finance</option>
              <option value="Natural Sciences">Natural Sciences</option>
            </select>

            {/* Risk Level Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3.5 py-3 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
            >
              <option value="All">All Risk Profiles</option>
              <option value="High">High Risk (Cognitive Traps)</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk Foundations</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterOptions.map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center space-x-1.5 ${
                  isSelected
                    ? "bg-[#8266F0] text-white shadow-md shadow-[#8266F0]/25"
                    : "bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10"
                }`}
              >
                {filter === "Bookmarked" && <Bookmark className="w-3.5 h-3.5" />}
                <span>{filter}</span>
                {filter === "Bookmarked" && bookmarks.length > 0 && (
                  <span className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white text-[#8266F0]" : "bg-[#8266F0]/20 text-[#8266F0]"
                  }`}>
                    {bookmarks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Current Active Filters info */}
      <div className="flex items-center justify-between mb-6 text-sm text-neutral-500 px-1">
        <span>
          Showing <strong className="text-neutral-900 dark:text-white font-semibold">{filteredCourses.length}</strong> {filteredCourses.length === 1 ? "course" : "courses"}
        </span>
        {(searchQuery || activeFilter !== "All" || riskFilter !== "All" || activeDiscipline !== "All") && (
          <button
            onClick={() => {
              setActiveFilter("All");
              setActiveDiscipline("All");
              setActiveTier("All");
              setSearchQuery("");
              setRiskFilter("All");
            }}
            className="text-xs text-[#8266F0] hover:underline font-medium"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Grid of Courses */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#8266F0] animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Synchronizing curriculum from Firestore...</p>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onSelect={onSelectCourse}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white dark:bg-[#1E1E24] rounded-3xl border border-black/5 dark:border-white/10">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 text-neutral-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
            No courses match your filter
          </h3>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">
            Try adjusting your search keywords, switching grade levels, or clearing the risk filter.
          </p>
          <button
            onClick={() => {
              setActiveFilter("All");
              setSearchQuery("");
              setRiskFilter("All");
            }}
            className="px-5 py-2.5 rounded-full bg-[#8266F0] text-white text-sm font-semibold hover:bg-[#7052eb] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Bottom Educational Banner */}
      <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-[#8266F0]/10 via-[#EC4899]/5 to-transparent border border-[#8266F0]/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#8266F0]">
            <Sparkles className="w-4 h-4" />
            <span>Not sure where to begin?</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Take the 3-minute Cognitive Baseline Diagnostic
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
            Our AI Pinpoints foundational gaps before you enroll, placing you directly into the optimal learning tier without repeating familiar material.
          </p>
        </div>
        <a
          href="#diagnostic"
          className="whitespace-nowrap px-6 py-3.5 rounded-full bg-[#8266F0] text-white text-sm font-semibold hover:bg-[#7052eb] shadow-lg shadow-[#8266F0]/25 transition-all transform hover:-translate-y-0.5"
        >
          Launch Diagnostic Loop
        </a>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Flame, 
  Bookmark, 
  Target, 
  ChevronRight, 
  Plus, 
  ExternalLink 
} from "lucide-react";
import { dataService } from "../services/dataService";
import { useThemeMode } from "../context/ThemeModeContext";

interface StudyPlanProps {
  onNavigate: (hash: string) => void;
}

export const StudyPlan: React.FC<StudyPlanProps> = ({ onNavigate }) => {
  const [completedItems, setCompletedItems] = useState<string[]>(["item-1"]);
  const { savedCourses } = useThemeMode();

  useEffect(() => {
    dataService.getStudyPlan().then((plan) => {
      if (plan?.todayTasks) {
        setCompletedItems(
          plan.todayTasks.filter((t: any) => t.completed).map((t: any) => t.id)
        );
      }
    });
  }, []);

  const toggleComplete = (id: string) => {
    setCompletedItems(prev => {
      const isDone = prev.includes(id);
      const next = isDone ? prev.filter(i => i !== id) : [...prev, id];
      dataService.updateStudyPlanTask("default_student", id, !isDone);
      return next;
    });
  };

  const todayTasks = [
    {
      id: "item-1",
      title: "Diagnostic Challenge: Binary Search Boundaries",
      category: "Practice",
      duration: "3 mins",
      actionHash: "#diagnostic",
    },
    {
      id: "item-2",
      title: "Review Misconception: Negative Factor Distribution",
      category: "Misconception Review",
      duration: "5 mins",
      actionHash: "#misconceptions",
    },
    {
      id: "item-3",
      title: "Micro-Lesson: MIT 6.006 Loop Invariants Cheatsheet",
      category: "Resource",
      duration: "10 mins",
      actionHash: "#library",
    },
  ];

  const weeklyMilestones = [
    {
      day: "Monday",
      title: "Foundations: Pointer aliasing & memory address invariants",
      completed: true,
    },
    {
      day: "Wednesday",
      title: "Practice: Recursive divide-and-conquer call stack verification",
      completed: true,
    },
    {
      day: "Today (Friday)",
      title: "Diagnostic: Binary Search boundary loop termination proofs",
      completed: false,
      isToday: true,
    },
    {
      day: "Sunday",
      title: "Review: Weekly Bayesian Mastery consolidation test",
      completed: false,
    },
  ];

  return (
    <div className="min-h-screen py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand/10 text-brand dark:bg-brand/20 font-bold text-xs tracking-wider uppercase mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Structured Cognitive Progression</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-display">
            My Study & Practice Plan
          </h1>
          <p className="adhd-hide text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            Targeted micro-milestones scheduled around your identified cognitive gaps to prevent cognitive decay and maintain retention.
          </p>
        </div>

        {/* Streak & Velocity Badge */}
        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center space-x-2 text-xs font-bold">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>5-Day Diagnostic Streak</span>
          </div>
        </div>
      </div>

      {/* 1. Today's Focused Agenda */}
      <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-neutral-900 dark:text-white">
              Today's Targeted Agenda
            </h2>
            <p className="adhd-hide text-xs text-neutral-500">
              Complete these 3 micro-tasks (total 18 mins) to stabilize your model.
            </p>
          </div>
          <span className="text-xs font-bold text-brand">
            {completedItems.length} of {todayTasks.length} Completed
          </span>
        </div>

        <div className="space-y-3">
          {todayTasks.map((task) => {
            const isDone = completedItems.includes(task.id);
            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                  isDone
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 hover:border-brand/40"
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : "border-2 border-neutral-300 dark:border-neutral-600 hover:border-brand"
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-400">
                        {task.category}
                      </span>
                      <span className="text-[11px] text-neutral-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{task.duration}</span>
                      </span>
                    </div>
                    <h3 className={`text-sm font-bold truncate mt-0.5 ${
                      isDone ? "line-through text-neutral-400" : "text-neutral-900 dark:text-white"
                    }`}>
                      {task.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(task.actionHash)}
                  className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold text-brand hover:bg-brand/10 transition flex items-center space-x-1"
                >
                  <span>Launch</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Weekly Mastery Milestones */}
      <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <h2 className="text-xl font-bold font-display text-neutral-900 dark:text-white">
            Weekly Progression Track
          </h2>
          <p className="adhd-hide text-xs text-neutral-500">
            Aligned with your active Learning Path: Algorithmic Rigor & Correctness.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {weeklyMilestones.map((m, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between ${
                m.isToday
                  ? "bg-brand/10 border-brand shadow-sm"
                  : m.completed
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 opacity-70"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={m.isToday ? "text-brand" : "text-neutral-500"}>
                    {m.day}
                  </span>
                  {m.completed && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  {m.isToday && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-brand text-white">
                      Active
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mt-2 line-clamp-3">
                  {m.title}
                </h4>
              </div>

              <div className="pt-2 text-[10px] font-bold text-neutral-400">
                {m.completed ? <><CheckCircle2 className="inline w-3 h-3 -mt-0.5 mr-1" aria-hidden="true" />Cleared</> : m.isToday ? "Pending exit ticket" : "Scheduled"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bookmarked Courses & Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved Courses */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-brand" />
              <span>Saved Courses</span>
            </h3>
            <button
              onClick={() => onNavigate("#courses")}
              className="text-xs font-bold text-brand hover:underline"
            >
              Explore more
            </button>
          </div>

          <div className="space-y-2.5">
            {savedCourses.length === 0 && (
              <p className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 text-xs text-neutral-500 dark:text-neutral-400">
                No saved courses yet. Tap the bookmark icon on any course to keep it here.
              </p>
            )}
            {savedCourses.map((c) => (
              <div
                key={c.id}
                onClick={() => onNavigate("#courses")}
                className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between cursor-pointer hover:border-brand/30 transition"
              >
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                    {c.title}
                  </h4>
                  <span className="text-[10px] text-neutral-400">{c.tier} • {c.discipline}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Diagnostic Jump */}
        <div className="rounded-3xl bg-gradient-to-br from-brand/15 to-[#EC4899]/15 border border-brand/20 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Spaced Cognitive Reinforcement</span>
            </div>
            <h3 className="text-lg font-bold font-display text-neutral-900 dark:text-white">
              Ready for a 60-Second Challenge?
            </h3>
            <p className="adhd-hide text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Verify your retention on negative sign distribution before tonight's Bayesian decay window.
            </p>
          </div>

          <button
            onClick={() => onNavigate("#diagnostic")}
            className="w-full py-3 rounded-2xl bg-[#141414] dark:bg-white text-white dark:text-[#141414] hover:opacity-90 font-bold text-xs shadow transition flex items-center justify-center space-x-2"
          >
            <span>Start Micro-Challenge</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};

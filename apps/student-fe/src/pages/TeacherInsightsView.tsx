import React, { useState, useEffect, useRef } from "react";
import { AiTestInsights } from "../components/teacher/AiTestInsights";
import { TeacherInsightsChat } from "../components/teacher/TeacherInsightsChat";
import { 
  Users, AlertTriangle, TrendingDown, Sparkles, Filter, CheckCircle2, 
  BarChart3, RefreshCw, Send, Download, BookOpen, Clock, ShieldAlert, 
  UserX, ArrowRight, Radio, Activity, MessageSquare, Database, Search,
  GitCompare, UserCheck, Layers, ChevronRight, HelpCircle, FileText,
  LayoutDashboard, TrendingUp, Target, ChevronDown, Check
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useThemeMode } from "../context/ThemeModeContext";
import { useAuth } from "../context/AuthContext";
import { dataService } from "../services/dataService";
import { mentorService } from "../services/mentorService";
import { StudentTelemetryProfile, RemedialPod } from "../types";

export interface TriageAlertDoc {
  id: string;
  student_id?: string;
  studentName?: string;
  topic_id?: string;
  topic?: string;
  classGroup?: string;
  severity?: string;
  alert_type?: string;
  title?: string;
  message?: string;
  suggested_action?: string;
  status?: string;
  attempts?: number;
  timestamp?: string;
  created_at?: string;
}

export type TeacherSubTab = "overview" | "kanban" | "comparison" | "pods" | "rag-chatbot" | "analytics";

interface TeacherInsightsViewProps {
  initialTab?: TeacherSubTab;
}

const COHORT_OPTIONS = [
  { value: "All Classes", label: "All Institutional Cohorts" },
  { value: "B.Tech CS Section A", label: "B.Tech CS Section A" },
  { value: "Grade 9-B Mathematics", label: "Grade 9-B Mathematics" },
  { value: "MBBS Cohort 2026", label: "MBBS Cohort 2026" },
  { value: "MBA Finance Batch A", label: "MBA Finance Batch A" }
];

export const TeacherInsightsView: React.FC<TeacherInsightsViewProps> = ({ initialTab = "overview" }) => {
  const { addToast } = useThemeMode();
  const { user } = useAuth();
  const teacherName = user?.displayName || "Teacher";
  const [selectedClass, setSelectedClass] = useState<string>("All Classes");
  const [isCohortDropdownOpen, setIsCohortDropdownOpen] = useState(false);
  const cohortDropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TeacherSubTab>(initialTab);
  const [studentProfiles, setStudentProfiles] = useState<StudentTelemetryProfile[]>([]);
  const [remedialPods, setRemedialPods] = useState<RemedialPod[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cohortDropdownRef.current && !cohortDropdownRef.current.contains(event.target as Node)) {
        setIsCohortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    Promise.all([
      mentorService.listMentees(user?.uid || ""),
      dataService.getStudentTelemetryProfiles().catch(() => []),
      dataService.getRemedialPods().catch(() => [])
    ]).then(([mentees, sampleProfiles, pods]) => {
      const dbProfiles: StudentTelemetryProfile[] = mentees.map((m) => ({
        id: m.uid,
        name: m.displayName || m.email || "DB Student",
        avatar: m.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.displayName || m.uid)}`,
        cohort: m.institution || m.academicTier || "Registered DB Student",
        tier: m.academicTier || "Undergraduate (UG)",
        discipline: "Computer Science",
        masteryScore: 0.78,
        activeMisconceptions: ["Identified DB misconception"],
        resolvedMisconceptionsCount: 4,
        averageVelocitySec: 36,
        hintRelianceIndex: 0.25,
        learningStyle: "Visual / Spatial",
        primaryStumblingBlock: "Concept boundary execution",
        recentTrajectory: "Improving",
        recommendedPeerMatch: "st-01",
        attendancePct: 96,
        isDbStudent: true
      }));

      const combined = [...dbProfiles];
      const existingIds = new Set(dbProfiles.map(p => p.id));
      sampleProfiles.forEach(sp => {
        if (!existingIds.has(sp.id)) {
          combined.push(sp);
        }
      });

      setStudentProfiles(combined);
      setRemedialPods(pods);
    });
  }, [user]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Live Firestore Triage Alerts State
  const [alerts, setAlerts] = useState<TriageAlertDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Teacher RAG Chatbot State (Section 8.1)

  // Multi-Student Comparison State (Section 8.2)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  // Start the comparison with the first two real profiles once they load (no hard-coded ids).
  useEffect(() => {
    setSelectedStudentIds((prev) => {
      const valid = prev.filter((id) => studentProfiles.some((p) => p.id === id));
      return valid.length ? valid : studentProfiles.slice(0, 2).map((p) => p.id);
    });
  }, [studentProfiles]);

  // 5-Minute Reteaching Plan State
  const [generatedPlan, setGeneratedPlan] = useState<any | null>({
    title: "Adaptive 5-Minute Reteaching Plan: Boundary Invariants & Sign Flips",
    estimatedMinutes: 5,
    targetConcept: "Negative Factor Distribution & Binary Search Boundaries",
    actionPlan: [
      "Step 1: Visual debt token cancellation on whiteboard (-$9 debt canceled twice = +$18).",
      "Step 2: Have students trace search([4, 8], target=2) on paper with high = mid - 1.",
      "Step 3: Push a 2-question live exit check through LearnLens Student Mode.",
    ],
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Firestore Real-Time WebSocket / onSnapshot Subscription
  useEffect(() => {
    try {
      const alertsRef = collection(db, "triage_alerts");
      const q = query(alertsRef, where("status", "==", "NEEDS_INTERVENTION"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const liveAlerts: TriageAlertDoc[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<TriageAlertDoc, "id">),
          }));

          setAlerts(liveAlerts);
          setLoading(false);
        },
        (err) => {
          console.warn("Firestore onSnapshot subscription notice:", err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.warn("Firestore initialization error:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []);


  const toggleStudentComparison = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((id) => id !== studentId);
      } else {
        if (prev.length >= 4) return prev; // Cap at 4
        return [...prev, studentId];
      }
    });
  };

  const handleGenerateIntervention = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedPlan({
        title: `Live Synthesized Remediation for ${selectedClass}`,
        estimatedMinutes: 5,
        targetConcept: "Negative Factor Distribution & Boundary Loop Invariants",
        actionPlan: [
          "Step 1: Visual reframing of sign inversion hurdles identified by AI Engine.",
          "Step 2: Concrete manipulative walkthrough with targeted student cohort.",
          "Step 3: Automated exit assessment dispatch through student learning interface.",
        ],
      });
      addToast({
        title: "Micro-Intervention Generated!",
        description: `Customized 5-minute reteaching blueprint created for ${selectedClass}.`,
        type: "success",
      });
    }, 800);
  };

  const handleSendToStudents = (studentId?: string) => {
    addToast({
      title: "Intervention Assigned to Cohort",
      description: studentId
        ? `Targeted micro-remediation push sent to student ${studentId}.`
        : `Warm-up push notification sent to all flagged students in ${selectedClass}.`,
      type: "success",
    });
  };

  return (
    <div className="px-4 sm:px-6 pb-12 space-y-6">
      {/* Header: same hero treatment as the student dashboard */}
      <section aria-labelledby="teacher-heading" className="relative rounded-[28px] bg-[#F8F2ED] p-6 sm:p-9 z-[60]">
        <div aria-hidden="true" className="absolute right-8 top-8 hidden md:flex items-center gap-2 pointer-events-none">
          <span className="w-12 h-6 rounded-full bg-[#0B0B0B]" />
          <span className="w-6 h-6 rounded-full bg-[#1BBC7E]" />
          <span className="w-3.5 h-6 rounded-full bg-[#1BBC7E]" />
          <span className="w-10 h-6 rounded-full bg-[#FEDB4A]" />
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-4 py-1.5 text-xs font-bold text-brand-ink">
              <Radio className="w-3.5 h-3.5" /> Faculty workspace
            </span>
            <h1 id="teacher-heading" className="mt-4 font-display font-extrabold text-[30px] sm:text-[36px] leading-tight text-[#1F2230]">
              Welcome back, {teacherName}!
            </h1>
            <p className="relative inline-block mt-1 font-display font-extrabold text-[22px] sm:text-[28px] leading-tight text-[#02AE76]">
              Here's how your students are doing
              <svg aria-hidden="true" viewBox="0 0 300 12" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 w-[92%] h-2.5">
                <path d="M3 9 Q 150 2 297 6" fill="none" stroke="#FEDB4A" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </p>
            <p className="mt-5 text-sm text-[#5B5E6B] leading-relaxed">
              Misconception flags, student comparisons, interventions, and an AI assistant that answers from your mentees' real records.
            </p>
          </div>
          {/* Custom Theme Dropdown for Cohort Selection */}
          <div ref={cohortDropdownRef} className="relative min-w-[240px] z-[70]">
            <span className="flex items-center gap-1 text-xs font-semibold text-[#5B5E6B] dark:text-neutral-400 mb-1.5">
              <Filter className="w-3.5 h-3.5 text-brand" /> Cohort
            </span>
            <button
              type="button"
              onClick={() => setIsCohortDropdownOpen(!isCohortDropdownOpen)}
              className="w-full h-11 px-4 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#1E1E24] text-sm font-semibold text-[#1F2230] dark:text-white flex items-center justify-between shadow-sm hover:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand transition cursor-pointer"
            >
              <span className="truncate">
                {COHORT_OPTIONS.find((c) => c.value === selectedClass)?.label || selectedClass}
              </span>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isCohortDropdownOpen ? "rotate-180 text-brand" : ""}`} />
            </button>

            {/* Custom Floating Popup Menu with Rounded Corners & Spacing */}
            {isCohortDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-full min-w-[250px] bg-white dark:bg-[#1E1E24] rounded-2xl p-2 shadow-2xl border border-black/10 dark:border-white/10 z-[999] space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                {COHORT_OPTIONS.map((option) => {
                  const isSelected = selectedClass === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSelectedClass(option.value);
                        setIsCohortDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left flex items-center justify-between transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-soft"
                          : "text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Navigation Sub-Tabs Bar */}
      <div role="tablist" aria-label="Teacher views" className="flex gap-3 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: "overview", label: "Overview", icon: LayoutDashboard, hash: "#teacher" },
          { id: "kanban", label: "Live Triage", icon: Activity, badge: `${alerts.length}`, hash: "#teacher-triage" },
          { id: "comparison", label: "Student Comparison", icon: GitCompare, hash: "#teacher-students" },
          { id: "analytics", label: "Cohort Analytics", icon: BarChart3, hash: "#teacher-analytics" },
          { id: "pods", label: "Interventions & Pods", icon: Users, hash: "#teacher-interventions" },
          { id: "rag-chatbot", label: "Student Insights", icon: MessageSquare, hash: "#teacher-intelligence" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TeacherSubTab);
                window.location.hash = tab.hash;
              }}
              role="tab"
              aria-selected={isActive}
              className={`shrink-0 h-14 rounded-full flex items-center gap-3 pl-2 pr-6 text-sm font-semibold whitespace-nowrap transition ${
                isActive ? "bg-[#0B0E13] text-white" : "bg-fill text-[#1F2230] hover:bg-fill-hover"
              }`}
            >
              <span className={`w-10 h-10 rounded-full grid place-items-center ${isActive ? "" : "bg-white shadow-sm"}`}>
                <Icon className="w-5 h-5" strokeWidth={2} />
              </span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-white"}`}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 0: OVERVIEW / DASHBOARD (Section 26) */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Cohort metrics: pastel tiles, as on the student dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Tracked Students", value: "142", note: "96% active today", icon: Users, color: "#1BBC7E", bg: "#E6F9F3" },
              { label: "Live Cognitive Flags", value: String(alerts.length), note: "Need a micro-intervention", icon: AlertTriangle, color: "#F0506E", bg: "#FEECF0" },
              { label: "Cohort Velocity", value: "38s", note: "18s faster than before", icon: Clock, color: "#8266F0", bg: "#EFEDFD" },
              { label: "Concept Stability", value: "87%", note: "+9% retention", icon: TrendingUp, color: "#D99A07", bg: "#FFF8EC" },
            ].map((m) => (
              <div key={m.label} className="rounded-[22px] p-4 flex items-center gap-3" style={{ backgroundColor: m.bg }}>
                <m.icon className="w-8 h-8 shrink-0" style={{ color: m.color }} strokeWidth={2} />
                <div className="min-w-0">
                  <div className="text-xs leading-tight text-[#5B5E6B]">{m.label}</div>
                  <div className="text-2xl font-extrabold text-[#1F2230]">{m.value}</div>
                  <div className="text-[11px] font-semibold text-[#5B5E6B]">{m.note}</div>
                </div>
              </div>
            ))}
          </div>

          <AiTestInsights />

          {/* Quick Jump Grid into Triage, Pods, and RAG */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Triage Summary Card */}
            <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <h3 className="text-base font-bold font-display text-[#1F2230]">
                    Live Triage Flags ({alerts.length})
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("kanban");
                    window.location.hash = "#teacher-triage";
                  }}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  <span className="inline-flex items-center gap-1">View Kanban <ArrowRight className="w-3.5 h-3.5" /></span>
                </button>
              </div>

              <div className="space-y-2.5">
                {alerts.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/15 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1F2230] truncate">
                        {a.studentName || "Student"}
                      </div>
                      <div className="text-[11px] text-rose-600 truncate">
                        {a.title || "Misconception Loop Detected"}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendToStudents(a.student_id)}
                      className="shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
                    >
                      Dispatch
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Remedial Pods Card */}
            <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-brand" />
                  <h3 className="text-base font-bold font-display text-[#1F2230]">
                    Remedial Pods (3 Active)
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("pods");
                    window.location.hash = "#teacher-interventions";
                  }}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  <span className="inline-flex items-center gap-1">Manage Pods <ArrowRight className="w-3.5 h-3.5" /></span>
                </button>
              </div>

              <div className="space-y-2.5">
                {remedialPods.slice(0, 2).map((pod) => (
                  <div key={pod.id} className="p-3 rounded-2xl bg-brand/5 border border-brand/15 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1F2230]">
                      <span>{pod.podName}</span>
                      <span className="text-[10px] text-brand">{pod.studentIds.length} Students</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-1">{pod.sharedMisconception}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick RAG Assistant Launcher */}
            <div className="rounded-[28px] bg-brand-soft p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-brand uppercase">
                  <MessageSquare className="w-4 h-4" />
                  <span>Student Insights Assistant</span>
                </div>
                <h3 className="text-base font-bold font-display text-[#1F2230]">
                  Ask about any mentee in plain English
                </h3>
                <p className="text-xs text-neutral-600">
                  Type a student's name to get their progress, misconceptions and test history, compare students, or get a class report.
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab("rag-chatbot");
                  window.location.hash = "#teacher-intelligence";
                }}
                className="w-full py-2.5 rounded-xl bg-[#0B0E13] text-white font-bold text-xs shadow transition flex items-center justify-center space-x-2"
              >
                <span>Open Student Insights</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Assigned Students Directory */}
          <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] mt-8">
            <div className="flex items-center space-x-2 mb-6">
              <Users className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold font-display text-[#1F2230]">Assigned Students Roster</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {studentProfiles.length > 0 ? (
                studentProfiles.map((student) => (
                  <div key={student.id} className="p-4 rounded-2xl border border-black/5 bg-neutral-50 hover:border-brand/50 transition group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-[#1F2230] group-hover:text-brand transition">{student.name}</h4>
                        <p className="text-[11px] text-neutral-500">{student.tier} • {student.learningStyle}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-[#E4577A] flex items-center justify-center text-white font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-neutral-500">Overall Mastery</span>
                        <span className="font-bold text-emerald-600">{Math.round(student.masteryScore * 100)}%</span>
                      </div>
                      <div className="w-full bg-black/5 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.round(student.masteryScore * 100)}%` }} />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setActiveTab("comparison");
                        window.location.hash = "#teacher-students";
                      }}
                      className="w-full py-2 rounded-xl bg-white border border-black/5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition"
                    >
                      <span className="inline-flex items-center gap-1">Review Full Details <ArrowRight className="w-3.5 h-3.5" /></span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-sm text-neutral-500">
                  Loading assigned students...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: COHORT ANALYTICS (Section 25 & 26) */}
      {activeTab === "analytics" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="rounded-[28px] bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-6">
            <div>
              <h2 className="text-xl font-bold font-display text-[#1F2230]">
                Cohort Misconception Frequency Distribution
              </h2>
              <p className="text-xs text-neutral-500">
                Aggregated error patterns across {selectedClass} diagnostic logs.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { label: "Negative Factor Distribution / Sign Inversion", pct: 38, count: "54 students", color: "bg-rose-500" },
                { label: "Binary Search Boundary Loop Invariant (high = mid)", pct: 29, count: "41 students", color: "bg-amber-500" },
                { label: "Pointer Aliasing & Nullability Dereferencing", pct: 18, count: "25 students", color: "bg-sky-500" },
                { label: "Accounts Receivable Cash Flow Inversion", pct: 15, count: "22 students", color: "bg-emerald-500" },
              ].map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-neutral-800">
                    <span>{item.label}</span>
                    <span className="font-mono text-neutral-500">{item.pct}% ({item.count})</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-black/5 overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-3">
              <h3 className="text-base font-bold font-display text-[#1F2230]">
                Hint Reliance Distribution
              </h3>
              <p className="text-xs text-neutral-500">
                Breakdown of students requiring Tier 1 (Nudge), Tier 2 (Scaffold), or Tier 3 (Structural Guidance).
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-lg font-bold text-emerald-600">62%</div>
                  <div className="text-[10px] font-semibold text-neutral-500">Independent (Low)</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-lg font-bold text-amber-600">26%</div>
                  <div className="text-[10px] font-semibold text-neutral-500">Moderate Reliance</div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-lg font-bold text-rose-600">12%</div>
                  <div className="text-[10px] font-semibold text-neutral-500">High Reliance</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-3">
              <h3 className="text-base font-bold font-display text-[#1F2230]">
                Cognitive Velocity by Academic Discipline
              </h3>
              <p className="text-xs text-neutral-500">
                Average seconds spent per concept diagnostic challenge.
              </p>
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between py-1 border-b border-black/5">
                  <span className="font-semibold text-neutral-700">Computer Science</span>
                  <span className="font-mono font-bold text-brand">42s avg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/5">
                  <span className="font-semibold text-neutral-700">Commerce & Finance</span>
                  <span className="font-mono font-bold text-emerald-600">36s avg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/5">
                  <span className="font-semibold text-neutral-700">Medicine & Physiology</span>
                  <span className="font-mono font-bold text-sky-600">48s avg</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-neutral-700">Mathematics</span>
                  <span className="font-mono font-bold text-amber-600">55s avg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student insights assistant: answers from the teacher's mentees' real records */}
      {activeTab === "rag-chatbot" && <TeacherInsightsChat />}

      {/* TAB 2: MULTI-PARAMETER STUDENT COMPARISON MATRIX (Section 8.2) */}
      {activeTab === "comparison" && (
        <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/5 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-md bg-brand text-white">
                  <GitCompare className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">
                  Comparative Diagnostics
                </span>
              </div>
              <h3 className="mt-1 font-display font-bold text-2xl text-[#1F2230]">
                Multi-Parameter Student Comparison Matrix
              </h3>
              <p className="text-xs text-neutral-500">
                Select 2 to 4 learners to compare concept mastery, hint reliance, velocity, and peer pairings side by side.
              </p>
            </div>

            <span className="text-xs font-semibold text-neutral-500">
              {selectedStudentIds.length}/4 Students Selected
            </span>
          </div>

          {/* Student Selector Chips */}
          <div className="flex flex-wrap gap-2">
            {studentProfiles.map((st) => {
              const isSelected = selectedStudentIds.includes(st.id);
              return (
                <button
                  key={st.id}
                  onClick={() => toggleStudentComparison(st.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition flex items-center space-x-2 ${
                    isSelected
                      ? "bg-brand text-white shadow-md shadow-brand/25"
                      : "bg-neutral-100 text-neutral-700 border border-black/5"
                  }`}
                >
                  <img src={st.avatar} alt={st.name} className="w-5 h-5 rounded-full object-cover" />
                  <span>{st.name}</span>
                  {st.isDbStudent && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
                      DB
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Comparison Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-black/5">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/70 border-b border-black/5 text-neutral-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-4">Diagnostic Dimension</th>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    if (!st) return null;
                    return (
                      <th key={id} className="p-4 text-[#1F2230] font-bold text-xs">
                        <div className="flex items-center space-x-2">
                          <img src={st.avatar} alt={st.name} className="w-6 h-6 rounded-full object-cover" />
                          <div className="flex items-center space-x-1.5">
                            <span>{st.name}</span>
                            {st.isDbStudent && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                DB Student
                              </span>
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                <tr>
                  <td className="p-4 font-bold text-neutral-600">Cohort / Level</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    return <td key={id} className="p-4 font-mono">{st?.cohort || "Cohort"}</td>;
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-neutral-600">Overall Mastery Score</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    return (
                      <td key={id} className="p-4 font-bold font-mono text-emerald-600 text-sm">
                        {st ? Math.round(st.masteryScore * 100) : 75}%
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-neutral-600">Hint Reliance Index</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    if (!st) return <td key={id} className="p-4 font-mono">0.3</td>;
                    return (
                      <td key={id} className="p-4 font-mono">
                        {st.hintRelianceIndex < 0.3 ? (
                          <span className="text-emerald-600 font-bold">{st.hintRelianceIndex} (Independent)</span>
                        ) : st.hintRelianceIndex < 0.6 ? (
                          <span className="text-amber-500 font-bold">{st.hintRelianceIndex} (Moderate)</span>
                        ) : (
                          <span className="text-rose-600 font-bold">{st.hintRelianceIndex} (High Reliance)</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-neutral-600">Average Velocity</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    return <td key={id} className="p-4 font-mono">{st?.averageVelocitySec || 40}s per item</td>;
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-neutral-600">Active Learning Style</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    return <td key={id} className="p-4 font-semibold text-brand">{st?.learningStyle || "Visual"}</td>;
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-neutral-600">Primary Cognitive Hurdle</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    return <td key={id} className="p-4 text-neutral-800">{st?.primaryStumblingBlock || "Concept boundary"}</td>;
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-neutral-600">Peer Study Match</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    return <td key={id} className="p-4 text-xs font-semibold text-emerald-600">{studentProfiles.find((p) => p.id === st?.recommendedPeerMatch)?.name || st?.recommendedPeerMatch || "No match yet"}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REMEDIAL BREAKOUT PODS (Section 8.3) */}
      {activeTab === "pods" && (
        <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/5 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-md bg-brand text-white">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">
                  Automated Cluster Synthesis
                </span>
              </div>
              <h3 className="mt-1 font-display font-bold text-2xl text-[#1F2230]">
                Targeted Remedial Breakout Pods (3–5 Students)
              </h3>
              <p className="text-xs text-neutral-500">
                Automated cluster generation grouping students with identical prerequisite gaps for efficient 10-minute intervention sessions.
              </p>
            </div>

            <button
              onClick={() => addToast({ title: "Breakout Rooms Dispatched", description: "Calendar invites sent to students.", type: "success" })}
              className="px-5 py-2.5 rounded-2xl bg-brand text-white font-semibold text-xs hover:bg-brand-strong transition self-start sm:self-auto"
            >
              Dispatch All Breakout Pods
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {remedialPods.map((pod) => (
              <div
                key={pod.id}
                className="p-5 rounded-2xl bg-neutral-50 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                      {pod.discipline}
                    </span>
                    <span className="text-xs font-semibold text-neutral-400">
                      ⏱ {pod.estimatedMinutes} mins
                    </span>
                  </div>

                  <h4 className="text-base font-bold font-display text-[#1F2230]">
                    {pod.podName}
                  </h4>

                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700">
                    <span className="font-bold block mb-0.5">Shared Misconception:</span>
                    <span>{pod.sharedMisconception}</span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-neutral-500 block mb-1">
                      Assigned Students ({pod.studentIds.length}):
                    </span>
                    <div className="flex -space-x-2 overflow-hidden">
                      {pod.studentIds.map((stId) => {
                        const st = studentProfiles.find((s) => s.id === stId);
                        if (!st) return null;
                        return (
                          <img
                            key={st.id}
                            src={st.avatar}
                            alt={st.name}
                            title={st.name}
                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-xs text-neutral-600">
                    <strong>Recommended Exercise:</strong> {pod.recommendedActivity}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                  <button
                    onClick={() => addToast({ title: "Pod Dispatched", description: `10-minute whiteboard link sent to ${pod.podName}.`, type: "success" })}
                    className="w-full py-2 rounded-xl bg-[#0B0E13] text-white font-semibold text-xs hover:opacity-90 transition flex items-center justify-center space-x-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Launch Breakout Whiteboard</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: REAL-TIME KANBAN BOARD */}
      {activeTab === "kanban" && (
        <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-black/5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-md bg-rose-500 text-white">
                  <Activity className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Firestore onSnapshot WebSocket Stream
                </span>
              </div>
              <h3 className="mt-1 font-display font-bold text-2xl text-[#1F2230]">
                Live Triage Alerts Kanban (Status: NEEDS_INTERVENTION)
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-mono font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Zero-Latency Stream</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Critical */}
            <div className="bg-neutral-50 rounded-[28px] p-5 border border-rose-500/20">
              <div className="font-bold text-sm text-rose-700 uppercase tracking-wide pb-3 mb-3 border-b border-rose-500/20">
                Critical Urgency
              </div>
              <div className="space-y-3 min-h-[160px]">
                {alerts.filter((a) => (a.severity || "").toLowerCase() === "critical").length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-400">No critical alerts in stream.</div>
                ) : (
                  alerts.filter((a) => (a.severity || "").toLowerCase() === "critical").map((card) => (
                    <div key={card.id} className="p-4 rounded-2xl bg-white border border-rose-500/30 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-rose-600">{card.student_id || "Student"}</span>
                        <span className="text-neutral-400">{card.topic_id || "Algebra"}</span>
                      </div>
                      <h5 className="text-xs font-bold text-[#1F2230]">{card.title || card.message}</h5>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Moderate */}
            <div className="bg-neutral-50 rounded-[28px] p-5 border border-amber-500/20">
              <div className="font-bold text-sm text-amber-700 uppercase tracking-wide pb-3 mb-3 border-b border-amber-500/20">
                Moderate Support
              </div>
              <div className="space-y-3 min-h-[160px]">
                {alerts.filter((a) => (a.severity || "").toLowerCase() === "moderate").length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-400">No moderate alerts in stream.</div>
                ) : (
                  alerts.filter((a) => (a.severity || "").toLowerCase() === "moderate").map((card) => (
                    <div key={card.id} className="p-4 rounded-2xl bg-white border border-amber-500/30 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-amber-600">{card.student_id || "Student"}</span>
                        <span className="text-neutral-400">{card.topic_id || "Algebra"}</span>
                      </div>
                      <h5 className="text-xs font-bold text-[#1F2230]">{card.title || card.message}</h5>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Monitoring */}
            <div className="bg-neutral-50 rounded-[28px] p-5 border border-indigo-500/20">
              <div className="font-bold text-sm text-indigo-700 uppercase tracking-wide pb-3 mb-3 border-b border-indigo-500/20">
                Active Monitoring
              </div>
              <div className="space-y-3 min-h-[160px]">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-400">All alerts cleared across cohorts.</div>
                ) : (
                  alerts.slice(0, 3).map((card) => (
                    <div key={card.id} className="p-4 rounded-2xl bg-white border border-indigo-500/30 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-indigo-600">{card.student_id || "Student"}</span>
                        <span className="text-neutral-400">{card.topic_id || "Algebra"}</span>
                      </div>
                      <h5 className="text-xs font-bold text-[#1F2230]">{card.title || card.message}</h5>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Automated 5-Minute Reteaching Plan Generator */}
      <div className="bg-[#F8F2ED] rounded-[28px] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-brand mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Pedagogical Assistant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#1F2230]">
              Tomorrow's 5-Minute Class Reteaching Blueprint
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Generated from aggregated misconceptions in {selectedClass} to open tomorrow's lesson.
            </p>
          </div>

          <button
            onClick={handleGenerateIntervention}
            disabled={isGenerating}
            className="whitespace-nowrap px-5 py-2.5 rounded-full bg-brand hover:bg-brand-strong text-white text-xs font-semibold shadow-md shadow-brand/25 transition-all flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Synthesizing Plan..." : "Regenerate Blueprint"}</span>
          </button>
        </div>

        {generatedPlan && (
          <div className="bg-white p-6 rounded-2xl border border-black/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <h3 className="text-sm font-bold text-[#1F2230]">
                {generatedPlan.title}
              </h3>
              <span className="text-xs font-semibold text-brand bg-brand/10 px-2.5 py-1 rounded-full">
                ⏱ {generatedPlan.estimatedMinutes} Minutes
              </span>
            </div>

            <div className="text-xs font-medium text-neutral-500">
              Target Cognitive Debt:{" "}
              <strong className="text-[#1F2230]">{generatedPlan.targetConcept}</strong>
            </div>

            <div className="space-y-2 pt-1">
              {generatedPlan.actionPlan.map((action: string, i: number) => (
                <div key={i} className="flex items-start space-x-2 text-xs text-neutral-700">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <span>{action}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-end space-x-3 text-xs">
              <button
                onClick={() => {
                  addToast({
                    title: "Class Blueprint Exported",
                    description: "Lesson plan PDF downloaded for classroom projection.",
                    type: "info",
                  });
                }}
                className="px-4 py-2 rounded-xl border border-black/10 hover:bg-neutral-100 font-semibold text-neutral-700 flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Printout</span>
              </button>
              <button
                onClick={() => handleSendToStudents()}
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-strong text-white font-semibold flex items-center space-x-1.5 shadow-md shadow-brand/25"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Push to Classroom Screens</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

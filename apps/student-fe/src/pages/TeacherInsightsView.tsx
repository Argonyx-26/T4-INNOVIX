import React, { useState, useEffect } from "react";
import { 
  Users, AlertTriangle, TrendingDown, Sparkles, Filter, CheckCircle2, 
  BarChart3, RefreshCw, Send, Download, BookOpen, Clock, ShieldAlert, 
  UserX, ArrowRight, Radio, Activity, MessageSquare, Database, Search,
  GitCompare, UserCheck, Layers, ChevronRight, HelpCircle, FileText,
  LayoutDashboard, TrendingUp, Target
} from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useThemeMode } from "../context/ThemeModeContext";
import { dataService } from "../services/dataService";
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

export const TeacherInsightsView: React.FC<TeacherInsightsViewProps> = ({ initialTab = "overview" }) => {
  const { addToast } = useThemeMode();
  const [selectedClass, setSelectedClass] = useState<string>("All Classes");
  const [activeTab, setActiveTab] = useState<TeacherSubTab>(initialTab);
  const [studentProfiles, setStudentProfiles] = useState<StudentTelemetryProfile[]>([]);
  const [remedialPods, setRemedialPods] = useState<RemedialPod[]>([]);

  useEffect(() => {
    Promise.all([
      dataService.getStudentTelemetryProfiles(),
      dataService.getRemedialPods()
    ]).then(([profiles, pods]) => {
      setStudentProfiles(profiles);
      setRemedialPods(pods);
    });
  }, []);

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
  const [ragQuery, setRagQuery] = useState<string>("");
  const [isRagSearching, setIsRagSearching] = useState<boolean>(false);
  const [ragResponse, setRagResponse] = useState<any | null>({
    query: "Summarize Priya Sharma's learning trajectory over the last two weeks.",
    vectorSimilarity: "0.94 cosine similarity (Pinecone Vector Index)",
    synthesis: "Priya Sharma has cleared 5 algebraic hurdles over the last 14 days, accelerating velocity to 42s/problem. However, she has encountered a recurring boundary trap in Binary Search (high = mid instead of high = mid - 1) across 2 homework submissions. Her hint reliance index is low (0.28), indicating she attempts independent discovery before prompting.",
    citations: [
      { student: "Priya Sharma", task: "DSA Module 2: Binary Search", metric: "2 consecutive loop timeouts" },
      { student: "Priya Sharma", task: "Linear Equations", metric: "100% Mastery reached on Sept 23" }
    ],
    recommendation: "Assign targeted pair-programming with Arjun Verma on 2-element edge cases."
  });

  // Multi-Student Comparison State (Section 8.2)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(["st-priya-01", "st-arjun-02"]);

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

  // Handle RAG Semantic Query
  const handleExecuteRag = (customQuery?: string) => {
    const q = customQuery || ragQuery;
    if (!q.trim()) return;

    setIsRagSearching(true);
    setTimeout(() => {
      setIsRagSearching(false);
      if (q.toLowerCase().includes("priya")) {
        setRagResponse({
          query: q,
          vectorSimilarity: "0.96 cosine similarity (Pinecone Vector DB)",
          synthesis: "Priya Sharma has demonstrated 84% mastery in Computer Science. Her primary hurdle is 'Search Space Invariant Confusion' in binary search. Her cognitive velocity is 42 seconds, and her hint reliance index is 0.28 (very independent).",
          citations: [
            { student: "Priya Sharma", task: "Binary Search Bounds", metric: "2 loop timeouts" },
            { student: "Priya Sharma", task: "Array Invariants", metric: "Resolved in 1 attempt" }
          ],
          recommendation: "Pair with Arjun Verma for loop termination dry-runs."
        });
      } else if (q.toLowerCase().includes("section b") || q.toLowerCase().includes("struggling")) {
        setRagResponse({
          query: q,
          vectorSimilarity: "0.91 cosine similarity (Pinecone Vector DB)",
          synthesis: "In the active cohort, 4 students are experiencing persistent struggle loops: Rohan Patel (Sign Inversion, Class 9), Arjun Verma (Array Bounds, B.Tech CS), Dr. Kavita Nair (Phase 3 K+ Efflux, MBBS), and Vikram Das (Working Capital AR Inversion, MBA).",
          citations: [
            { student: "Rohan Patel", task: "Linear Equations", metric: "3 consecutive sign slips" },
            { student: "Arjun Verma", task: "Binary Search", metric: "High hint reliance (0.65)" }
          ],
          recommendation: "Trigger Remedial Breakout Pods Alpha & Beta."
        });
      } else {
        setRagResponse({
          query: q,
          vectorSimilarity: "0.89 cosine similarity (Pinecone Vector DB)",
          synthesis: `Vector synthesis across 6 vectorized student profiles: 68% of active misconceptions stem from boundary/sign inversion rather than conceptual apathy. Students respond with 87% clearance rate when presented with visual analogies rather than symbolic re-explanation.`,
          citations: [
            { student: "Cohort Aggregate", task: "6 Tracked Courses", metric: "24 total misconceptions logged" }
          ],
          recommendation: "Deploy tomorrow's 5-minute automated reteaching blueprint."
        });
      }
      setRagQuery("");
    }, 700);
  };

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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header section with Class Switcher and Live Telemetry Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold text-xs tracking-wider uppercase mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
            <span>Teacher & Faculty Intelligence Platform • RAG + Vector DB</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-display">
            Educator Command Center
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
            Real-time cognitive error telemetry, vector database querying, student comparisons, and automated remedial pods for 40 to 200+ students.
          </p>
        </div>

        {/* Class Filter Selector */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-neutral-500 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Cohort:</span>
          </span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
          >
            <option value="All Classes">All Institutional Cohorts</option>
            <option value="B.Tech CS Section A">B.Tech CS Section A</option>
            <option value="Grade 9-B Mathematics">Grade 9-B Mathematics</option>
            <option value="MBBS Cohort 2026">MBBS Cohort 2026</option>
            <option value="MBA Finance Batch A">MBA Finance Batch A</option>
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "overview", label: "Overview", icon: LayoutDashboard, hash: "#teacher" },
          { id: "kanban", label: "Live Triage", icon: Activity, badge: `${alerts.length} Live`, hash: "#teacher-triage" },
          { id: "comparison", label: "Student Comparison", icon: GitCompare, badge: "Multi-Param", hash: "#teacher-students" },
          { id: "analytics", label: "Cohort Analytics", icon: BarChart3, hash: "#teacher-analytics" },
          { id: "pods", label: "Interventions & Pods", icon: Users, badge: "Auto-Cluster", hash: "#teacher-interventions" },
          { id: "rag-chatbot", label: "RAG Intelligence", icon: MessageSquare, badge: "Vector DB", hash: "#teacher-intelligence" },
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
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition flex items-center space-x-2 ${
                isActive
                  ? "bg-[#8266F0] text-white shadow-md shadow-[#8266F0]/25"
                  : "bg-white dark:bg-[#1E1E24] text-neutral-700 dark:text-slate-300 border border-black/5 dark:border-white/10 hover:border-[#8266F0]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-[#8266F0]/10 text-[#8266F0]"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 0: OVERVIEW / DASHBOARD (Section 26) */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Cohort Telemetry Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-neutral-500">Tracked Students</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white font-display">142</div>
              <span className="text-[11px] text-emerald-600 font-bold">96% Active Today</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-neutral-500">Live Cognitive Flags</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-display">{alerts.length}</div>
              <span className="text-[11px] text-rose-500 font-bold">Needs Micro-Intervention</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-neutral-500">Cohort Velocity</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#8266F0] font-display">38s</div>
              <span className="text-[11px] text-emerald-600 font-bold">-18s faster vs legacy</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-neutral-500">Concept Stability</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display">87%</div>
              <span className="text-[11px] text-emerald-600 font-bold">+9% Retention</span>
            </div>
          </div>

          {/* Quick Jump Grid into Triage, Pods, and RAG */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Triage Summary Card */}
            <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
                    Live Triage Flags ({alerts.length})
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("kanban");
                    window.location.hash = "#teacher-triage";
                  }}
                  className="text-xs font-bold text-[#8266F0] hover:underline"
                >
                  View Kanban →
                </button>
              </div>

              <div className="space-y-2.5">
                {alerts.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/15 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {a.studentName || "Student"}
                      </div>
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 truncate">
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
            <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#8266F0]" />
                  <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
                    Remedial Pods (3 Active)
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("pods");
                    window.location.hash = "#teacher-interventions";
                  }}
                  className="text-xs font-bold text-[#8266F0] hover:underline"
                >
                  Manage Pods →
                </button>
              </div>

              <div className="space-y-2.5">
                {remedialPods.slice(0, 2).map((pod) => (
                  <div key={pod.id} className="p-3 rounded-2xl bg-[#8266F0]/5 border border-[#8266F0]/15 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-white">
                      <span>{pod.podName}</span>
                      <span className="text-[10px] text-[#8266F0]">{pod.studentIds.length} Students</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-1">{pod.sharedMisconception}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick RAG Assistant Launcher */}
            <div className="rounded-3xl bg-gradient-to-br from-[#8266F0]/15 to-[#EC4899]/15 border border-[#8266F0]/25 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#8266F0] uppercase">
                  <MessageSquare className="w-4 h-4" />
                  <span>Pinecone Vector RAG</span>
                </div>
                <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
                  Ask Natural Language Queries
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  Search across student profiles, homework submissions, and error logs instantly with cosine vector similarity.
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab("rag-chatbot");
                  window.location.hash = "#teacher-intelligence";
                }}
                className="w-full py-2.5 rounded-xl bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-bold text-xs shadow transition flex items-center justify-center space-x-2"
              >
                <span>Launch RAG Chatbot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Assigned Students Directory */}
          <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 shadow-sm mt-8">
            <div className="flex items-center space-x-2 mb-6">
              <Users className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold font-display text-neutral-900 dark:text-white">Assigned Students Roster</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {studentProfiles.length > 0 ? (
                studentProfiles.map((student) => (
                  <div key={student.id} className="p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-[#17171B] hover:border-[#8266F0]/50 transition group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-[#8266F0] transition">{student.name}</h4>
                        <p className="text-[11px] text-neutral-500">{student.academicTier} • {student.learningStyle}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8266F0] to-[#EC4899] flex items-center justify-center text-white font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-neutral-500">Overall Mastery</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.round(student.masteryScore * 100)}%</span>
                      </div>
                      <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.round(student.masteryScore * 100)}%` }} />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setActiveTab("comparison");
                        window.location.hash = "#teacher-students";
                      }}
                      className="w-full py-2 rounded-xl bg-white dark:bg-[#2A2A35] border border-black/5 dark:border-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#343440] transition"
                    >
                      Review Full Details →
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
          <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold font-display text-neutral-900 dark:text-white">
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
                  <div className="flex justify-between text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    <span>{item.label}</span>
                    <span className="font-mono text-neutral-500">{item.pct}% ({item.count})</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
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

            <div className="rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 shadow-sm space-y-3">
              <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white">
                Cognitive Velocity by Academic Discipline
              </h3>
              <p className="text-xs text-neutral-500">
                Average seconds spent per concept diagnostic challenge.
              </p>
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Computer Science</span>
                  <span className="font-mono font-bold text-[#8266F0]">42s avg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Commerce & Finance</span>
                  <span className="font-mono font-bold text-emerald-600">36s avg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-black/5 dark:border-white/5">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Medicine & Physiology</span>
                  <span className="font-mono font-bold text-sky-600">48s avg</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Mathematics</span>
                  <span className="font-mono font-bold text-amber-600">55s avg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: TEACHER RAG CHATBOT (Section 8.1) */}
      {activeTab === "rag-chatbot" && (
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-md bg-[#8266F0] text-white">
                  <Database className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8266F0]">
                  Vector Database & Natural Language Inquiries
                </span>
              </div>
              <h3 className="mt-1 font-display font-bold text-2xl text-neutral-900 dark:text-white">
                Teacher RAG Vector Intelligence Chatbot
              </h3>
              <p className="text-xs text-neutral-500">
                Query individual student trajectories, aggregate class bottlenecks, or compare learning curves in plain English.
              </p>
            </div>

            <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-mono font-bold border border-emerald-500/20 self-start sm:self-auto">
              Pinecone Vector Index Active
            </div>
          </div>

          {/* Quick Query Prompt Chips */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-500">Sample Inquiries:</span>
            <div className="flex flex-wrap gap-2">
              {[
                "Summarize Priya's learning trajectory over the last two weeks.",
                "Which students in Section B are still struggling with Pointer Aliasing?",
                "What are this student's major misconceptions in Mathematics / Data Structures?",
                "Identify students ready for advanced Olympiad / Hackathon challenges.",
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExecuteRag(chip)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-[#8266F0]/15 hover:text-[#8266F0] text-xs font-medium text-neutral-700 dark:text-slate-300 transition text-left"
                >
                  "{chip}"
                </button>
              ))}
            </div>
          </div>

          {/* Query Search Bar */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Ask anything about student telemetry, misconceptions, or assignment performance..."
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExecuteRag()}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
              />
            </div>
            <button
              onClick={() => handleExecuteRag()}
              disabled={isRagSearching}
              className="px-6 py-3 rounded-2xl bg-[#8266F0] hover:bg-[#7052eb] text-white text-sm font-semibold transition flex items-center space-x-2 disabled:opacity-50"
            >
              {isRagSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Query Vector RAG</span>
            </button>
          </div>

          {/* Synthesized Response Card */}
          {ragResponse && (
            <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-[#8266F0]/30 shadow-md space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-black/5 dark:border-white/10 gap-2">
                <span className="text-xs font-mono font-bold text-[#8266F0]">
                  Query: "{ragResponse.query}"
                </span>
                <span className="text-[11px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {ragResponse.vectorSimilarity}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Synthesized Diagnostic Telemetry:
                </h4>
                <p className="text-sm text-neutral-900 dark:text-slate-100 leading-relaxed font-sans">
                  {ragResponse.synthesis}
                </p>
              </div>

              {/* Citations & Evidence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {ragResponse.citations.map((cite: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 text-xs">
                    <span className="font-bold text-neutral-800 dark:text-white block">
                      {cite.student} • {cite.task}
                    </span>
                    <span className="text-neutral-500 text-[11px]">
                      Evidence: {cite.metric}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recommended Action */}
              <div className="p-3.5 rounded-xl bg-[#8266F0]/10 border border-[#8266F0]/20 flex items-center justify-between text-xs text-[#8266F0]">
                <span>
                  <strong>Pedagogical Next Step:</strong> {ragResponse.recommendation}
                </span>
                <button
                  onClick={() => addToast({ title: "Action Scheduled", description: "Pedagogical intervention queued for cohort.", type: "success" })}
                  className="px-3 py-1 rounded-lg bg-[#8266F0] text-white font-semibold text-[11px] hover:bg-[#7052eb] transition shrink-0 ml-2"
                >
                  Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MULTI-PARAMETER STUDENT COMPARISON MATRIX (Section 8.2) */}
      {activeTab === "comparison" && (
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-md bg-[#8266F0] text-white">
                  <GitCompare className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8266F0]">
                  Comparative Diagnostics
                </span>
              </div>
              <h3 className="mt-1 font-display font-bold text-2xl text-neutral-900 dark:text-white">
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
                      ? "bg-[#8266F0] text-white shadow-md shadow-[#8266F0]/25"
                      : "bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-slate-300 border border-black/5 dark:border-white/10"
                  }`}
                >
                  <img src={st.avatar} alt={st.name} className="w-5 h-5 rounded-full object-cover" />
                  <span>{st.name}</span>
                </button>
              );
            })}
          </div>

          {/* Comparison Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/70 dark:bg-white/5 border-b border-black/5 dark:border-white/10 text-neutral-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-4">Diagnostic Dimension</th>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    if (!st) return null;
                    return (
                      <th key={id} className="p-4 text-neutral-900 dark:text-white font-bold text-xs">
                        <div className="flex items-center space-x-2">
                          <img src={st.avatar} alt={st.name} className="w-6 h-6 rounded-full object-cover" />
                          <span>{st.name}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                <tr>
                  <td className="p-4 font-bold text-neutral-600 dark:text-slate-400">Cohort / Level</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    return <td key={id} className="p-4 font-mono">{st?.cohort || "Cohort"}</td>;
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-neutral-600 dark:text-slate-400">Overall Mastery Score</td>
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
                  <td className="p-4 font-bold text-neutral-600 dark:text-slate-400">Hint Reliance Index</td>
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
                  <td className="p-4 font-bold text-neutral-600 dark:text-slate-400">Average Velocity</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    return <td key={id} className="p-4 font-mono">{st?.averageVelocitySec || 40}s per item</td>;
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-neutral-600 dark:text-slate-400">Active Learning Style</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    return <td key={id} className="p-4 font-semibold text-[#8266F0]">{st?.learningStyle || "Visual"}</td>;
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-neutral-600 dark:text-slate-400">Primary Cognitive Hurdle</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    return <td key={id} className="p-4 text-neutral-800 dark:text-slate-200">{st?.primaryStumblingBlock || "Concept boundary"}</td>;
                  })}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-neutral-600 dark:text-slate-400">Peer Study Match</td>
                  {selectedStudentIds.map((id) => {
                    const st = studentProfiles.find((s) => s.id === id);
                    return <td key={id} className="p-4 text-xs font-semibold text-emerald-600">{st?.recommendedPeerMatch || "Peer study match"}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REMEDIAL BREAKOUT PODS (Section 8.3) */}
      {activeTab === "pods" && (
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-md bg-[#8266F0] text-white">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8266F0]">
                  Automated Cluster Synthesis
                </span>
              </div>
              <h3 className="mt-1 font-display font-bold text-2xl text-neutral-900 dark:text-white">
                Targeted Remedial Breakout Pods (3–5 Students)
              </h3>
              <p className="text-xs text-neutral-500">
                Automated cluster generation grouping students with identical prerequisite gaps for efficient 10-minute intervention sessions.
              </p>
            </div>

            <button
              onClick={() => addToast({ title: "Breakout Rooms Dispatched", description: "Calendar invites sent to students.", type: "success" })}
              className="px-5 py-2.5 rounded-2xl bg-[#8266F0] text-white font-semibold text-xs hover:bg-[#7052eb] transition self-start sm:self-auto"
            >
              Dispatch All Breakout Pods
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {remedialPods.map((pod) => (
              <div
                key={pod.id}
                className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8266F0] bg-[#8266F0]/10 px-2 py-0.5 rounded-full">
                      {pod.discipline}
                    </span>
                    <span className="text-xs font-semibold text-neutral-400">
                      ⏱ {pod.estimatedMinutes} mins
                    </span>
                  </div>

                  <h4 className="text-base font-bold font-display text-neutral-900 dark:text-white">
                    {pod.podName}
                  </h4>

                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
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
                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#1E1E24] object-cover"
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-xs text-neutral-600 dark:text-slate-300">
                    <strong>Recommended Exercise:</strong> {pod.recommendedActivity}
                  </div>
                </div>

                <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => addToast({ title: "Pod Dispatched", description: `10-minute whiteboard link sent to ${pod.podName}.`, type: "success" })}
                    className="w-full py-2 rounded-xl bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-semibold text-xs hover:opacity-90 transition flex items-center justify-center space-x-1.5"
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
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-md bg-rose-500 text-white">
                  <Activity className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Firestore onSnapshot WebSocket Stream
                </span>
              </div>
              <h3 className="mt-1 font-display font-bold text-2xl text-neutral-900 dark:text-white">
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
            <div className="bg-neutral-50 dark:bg-neutral-900/60 rounded-3xl p-5 border border-rose-500/20">
              <div className="font-bold text-sm text-rose-700 dark:text-rose-400 uppercase tracking-wide pb-3 mb-3 border-b border-rose-500/20">
                Critical Urgency
              </div>
              <div className="space-y-3 min-h-[160px]">
                {alerts.filter((a) => (a.severity || "").toLowerCase() === "critical").length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-400">No critical alerts in stream.</div>
                ) : (
                  alerts.filter((a) => (a.severity || "").toLowerCase() === "critical").map((card) => (
                    <div key={card.id} className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-rose-500/30 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-rose-600">{card.student_id || "Student"}</span>
                        <span className="text-neutral-400">{card.topic_id || "Algebra"}</span>
                      </div>
                      <h5 className="text-xs font-bold text-neutral-900 dark:text-white">{card.title || card.message}</h5>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Moderate */}
            <div className="bg-neutral-50 dark:bg-neutral-900/60 rounded-3xl p-5 border border-amber-500/20">
              <div className="font-bold text-sm text-amber-700 dark:text-amber-400 uppercase tracking-wide pb-3 mb-3 border-b border-amber-500/20">
                Moderate Support
              </div>
              <div className="space-y-3 min-h-[160px]">
                {alerts.filter((a) => (a.severity || "").toLowerCase() === "moderate").length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-400">No moderate alerts in stream.</div>
                ) : (
                  alerts.filter((a) => (a.severity || "").toLowerCase() === "moderate").map((card) => (
                    <div key={card.id} className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-amber-500/30 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-amber-600">{card.student_id || "Student"}</span>
                        <span className="text-neutral-400">{card.topic_id || "Algebra"}</span>
                      </div>
                      <h5 className="text-xs font-bold text-neutral-900 dark:text-white">{card.title || card.message}</h5>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active Monitoring */}
            <div className="bg-neutral-50 dark:bg-neutral-900/60 rounded-3xl p-5 border border-indigo-500/20">
              <div className="font-bold text-sm text-indigo-700 dark:text-indigo-400 uppercase tracking-wide pb-3 mb-3 border-b border-indigo-500/20">
                Active Monitoring
              </div>
              <div className="space-y-3 min-h-[160px]">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-neutral-400">All alerts cleared across cohorts.</div>
                ) : (
                  alerts.slice(0, 3).map((card) => (
                    <div key={card.id} className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-indigo-500/30 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-indigo-600">{card.student_id || "Student"}</span>
                        <span className="text-neutral-400">{card.topic_id || "Algebra"}</span>
                      </div>
                      <h5 className="text-xs font-bold text-neutral-900 dark:text-white">{card.title || card.message}</h5>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Automated 5-Minute Reteaching Plan Generator */}
      <div className="bg-gradient-to-br from-[#8266F0]/10 via-white to-transparent dark:from-[#8266F0]/10 dark:via-[#1E1E24] dark:to-transparent rounded-3xl p-6 sm:p-8 border border-[#8266F0]/30 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#8266F0] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Pedagogical Assistant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-white">
              Tomorrow's 5-Minute Class Reteaching Blueprint
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Generated from aggregated misconceptions in {selectedClass} to open tomorrow's lesson.
            </p>
          </div>

          <button
            onClick={handleGenerateIntervention}
            disabled={isGenerating}
            className="whitespace-nowrap px-5 py-2.5 rounded-full bg-[#8266F0] hover:bg-[#7052eb] text-white text-xs font-semibold shadow-md shadow-[#8266F0]/25 transition-all flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Synthesizing Plan..." : "Regenerate Blueprint"}</span>
          </button>
        </div>

        {generatedPlan && (
          <div className="bg-white dark:bg-[#1E1E24] p-6 rounded-2xl border border-black/5 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {generatedPlan.title}
              </h3>
              <span className="text-xs font-semibold text-[#8266F0] bg-[#8266F0]/10 px-2.5 py-1 rounded-full">
                ⏱ {generatedPlan.estimatedMinutes} Minutes
              </span>
            </div>

            <div className="text-xs font-medium text-neutral-500">
              Target Cognitive Debt:{" "}
              <strong className="text-neutral-900 dark:text-white">{generatedPlan.targetConcept}</strong>
            </div>

            <div className="space-y-2 pt-1">
              {generatedPlan.actionPlan.map((action: string, i: number) => (
                <div key={i} className="flex items-start space-x-2 text-xs text-neutral-700 dark:text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-[#8266F0] shrink-0 mt-0.5" />
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
                className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 font-semibold text-neutral-700 dark:text-neutral-300 flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Printout</span>
              </button>
              <button
                onClick={() => handleSendToStudents()}
                className="px-4 py-2 rounded-xl bg-[#8266F0] hover:bg-[#7052eb] text-white font-semibold flex items-center space-x-1.5 shadow-md shadow-[#8266F0]/25"
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

/**
 * Retrieval side of the teacher insights assistant: resolves which students a question is
 * about, loads their records, and computes every number locally, so the AI only narrates
 * facts it was given (and the teacher sees the same facts as data cards).
 */
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { StudentMisconceptionRecord, StudentTelemetryProfile, UserProfile } from "../types";
import { AiMisconceptionRecord, AiTestAttempt } from "./dataService";
import { buildReport, TopicMasteryMap } from "./learningService";
import { TutorError } from "./tutorService";

const withTimeout = <T,>(promise: Promise<T>, ms = 10000): Promise<T> =>
  Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms))]);

const pct = (v: number) => Math.round(v * 100);
const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const toDate = (s?: string) => (s ? new Date(s.includes("T") ? s : `${s.replace(" ", "T")}Z`) : null);

export interface RosterEntry {
  id: string;
  name: string;
  sample: boolean;
  profile?: UserProfile;
  telemetry?: StudentTelemetryProfile;
}

export interface StudentDossier {
  id: string;
  name: string;
  sample: boolean;
  level?: string;
  institution?: string;
  lastActive: string | null;
  overallMastery: number | null;
  masteryTrend: { from: number; to: number; since: string } | null;
  topics: { topic: string; subject: string; mastery: number; attempts: number; correct: number }[];
  strongTopics: string[];
  weakTopics: string[];
  activeMisconceptions: { title: string; topic: string; occurrences: number; status: string; flaggedForTeacher: boolean; practiceStreak: number }[];
  resolvedMisconceptions: { title: string; topic: string; resolvedOn: string | null }[];
  tests: { taken: number; averageScore: number | null; recent: { topic: string; difficulty: string; score: string; date: string }[] };
  sampleProfile?: {
    cohort: string;
    learningStyle: string;
    primaryStumblingBlock: string;
    trajectory: string;
    averageSecondsPerAnswer: number;
    hintReliance: number;
    attendance: number;
  };
}

export interface ClassSummary {
  mentees: number;
  sampleStudents: number;
  averageMastery: number | null;
  averageTestScore: number | null;
  activeMisconceptions: number;
  commonMisconceptions: { title: string; students: number; occurrences: number; names: string[] }[];
  weakestTopics: { topic: string; averageMastery: number; students: number }[];
  needsAttention: { name: string; reason: string }[];
  strongest: { name: string; overallMastery: number }[];
}

// ---------------------------------------------------------------------------
// Dossiers
// ---------------------------------------------------------------------------
export async function buildDossier(entry: RosterEntry): Promise<StudentDossier> {
  if (entry.sample && entry.telemetry) return sampleDossier(entry.telemetry);
  const uid = entry.id;
  const [misSnap, masterySnap, attemptSnap] = await Promise.all([
    withTimeout(getDocs(query(collection(db, "misconceptions"), where("studentId", "==", uid)))),
    withTimeout(getDoc(doc(db, "users", uid, "data", "topic_mastery"))),
    withTimeout(getDocs(query(collection(db, "ai_test_attempts"), where("studentId", "==", uid)))),
  ]);
  const records = misSnap.docs.map((d) => ({ ...(d.data() as StudentMisconceptionRecord), id: d.id }));
  const mastery: TopicMasteryMap = masterySnap.exists() ? (masterySnap.data().topics as TopicMasteryMap) || {} : {};
  const attempts = attemptSnap.docs
    .map((d) => d.data() as AiTestAttempt)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const report = buildReport(mastery, records);

  const activity = [
    ...report.topics.map((t) => toDate(t.lastPracticed)),
    ...attempts.map((a) => toDate(a.createdAt)),
    ...records.map((r) => toDate(r.lastAttempt)),
  ].filter((d): d is Date => !!d && !isNaN(d.getTime()));
  const lastActive = activity.length ? new Date(Math.max(...activity.map((d) => d.getTime()))).toISOString().slice(0, 10) : null;
  const first = report.progress[0];
  const last = report.progress[report.progress.length - 1];

  return {
    id: uid,
    name: entry.name,
    sample: false,
    level: entry.profile?.academicTier,
    institution: entry.profile?.institution,
    lastActive,
    overallMastery: report.overallMastery === null ? null : pct(report.overallMastery),
    masteryTrend: first && last && first.date !== last.date ? { from: pct(first.mastery), to: pct(last.mastery), since: first.date } : null,
    topics: report.topics.slice(0, 12).map((t) => ({ topic: t.topic, subject: t.subject, mastery: pct(t.mastery), attempts: t.attempts, correct: t.correct })),
    strongTopics: report.strong.map((t) => t.topic),
    weakTopics: report.weak.map((t) => t.topic),
    activeMisconceptions: report.active.slice(0, 30).map((r) => {
      const ai = r as Partial<AiMisconceptionRecord>;
      return {
        title: r.identifiedMisconception,
        topic: r.conceptName,
        occurrences: r.attemptCount,
        status: r.status,
        flaggedForTeacher: !!ai.flagged,
        practiceStreak: ai.practiceStreak || 0,
      };
    }),
    resolvedMisconceptions: report.resolved.slice(0, 30).map((r) => ({
      title: r.identifiedMisconception,
      topic: r.conceptName,
      resolvedOn: r.resolutionTimestamp ? r.resolutionTimestamp.slice(0, 10) : null,
    })),
    tests: {
      taken: attempts.length,
      averageScore: mean(attempts.map((a) => (a.score / Math.max(1, a.total)) * 100)),
      recent: attempts.slice(0, 5).map((a) => ({ topic: a.topic, difficulty: a.difficulty, score: `${a.score}/${a.total}`, date: (a.createdAt || "").slice(0, 10) })),
    },
  };
}

function sampleDossier(t: StudentTelemetryProfile): StudentDossier {
  return {
    id: t.id,
    name: t.name,
    sample: true,
    level: t.tier,
    lastActive: null,
    overallMastery: pct(t.masteryScore),
    masteryTrend: null,
    topics: [{ topic: t.discipline, subject: t.discipline, mastery: pct(t.masteryScore), attempts: 0, correct: 0 }],
    strongTopics: t.masteryScore >= 0.75 ? [t.discipline] : [],
    weakTopics: t.masteryScore < 0.5 ? [t.discipline] : [],
    activeMisconceptions: t.activeMisconceptions.map((m) => ({
      title: m,
      topic: t.discipline,
      occurrences: 1,
      status: "Detected",
      flaggedForTeacher: t.recentTrajectory === "At-Risk",
      practiceStreak: 0,
    })),
    resolvedMisconceptions: Array.from({ length: Math.min(t.resolvedMisconceptionsCount, 5) }, (_, i) => ({ title: `Resolved foundational concept #${i + 1}`, topic: t.discipline, resolvedOn: null })),
    tests: { taken: 0, averageScore: null, recent: [] },
    sampleProfile: {
      cohort: t.cohort,
      learningStyle: t.learningStyle,
      primaryStumblingBlock: t.primaryStumblingBlock,
      trajectory: t.recentTrajectory,
      averageSecondsPerAnswer: t.averageVelocitySec,
      hintReliance: pct(t.hintRelianceIndex),
      attendance: t.attendancePct,
    },
  };
}

// ---------------------------------------------------------------------------
// Class summary
// ---------------------------------------------------------------------------
export function summariseClass(dossiers: StudentDossier[]): ClassSummary {
  const common = new Map<string, { title: string; names: Set<string>; occurrences: number }>();
  const topics = new Map<string, number[]>();
  dossiers.forEach((d) => {
    d.activeMisconceptions.forEach((m) => {
      const key = m.title.toLowerCase().trim();
      const entry = common.get(key) || { title: m.title, names: new Set<string>(), occurrences: 0 };
      entry.names.add(d.name);
      entry.occurrences += m.occurrences;
      common.set(key, entry);
    });
    if (!d.sample) d.topics.forEach((t) => topics.set(t.topic, [...(topics.get(t.topic) || []), t.mastery]));
  });

  const needsAttention = dossiers
    .map((d) => {
      const reasons: string[] = [];
      if (d.overallMastery !== null && d.overallMastery < 50) reasons.push(`mastery ${d.overallMastery}%`);
      if (d.activeMisconceptions.length >= 1) {
        const titles = d.activeMisconceptions.map((m) => m.title).join("; ");
        reasons.push(`${d.activeMisconceptions.length} active misconceptions: [${titles}]`);
      }
      const flagged = d.activeMisconceptions.filter((m) => m.flaggedForTeacher).length;
      if (flagged) reasons.push(`${flagged} repeated misconception${flagged > 1 ? "s" : ""}`);
      if (d.sampleProfile?.trajectory === "At-Risk") reasons.push("at-risk trajectory");
      return { name: d.name, reason: reasons.join(", "), weight: reasons.length * 100 - (d.overallMastery ?? 50) };
    })
    .filter((x) => x.reason)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10)
    .map(({ name, reason }) => ({ name, reason }));

  return {
    mentees: dossiers.filter((d) => !d.sample).length,
    sampleStudents: dossiers.filter((d) => d.sample).length,
    averageMastery: mean(dossiers.map((d) => d.overallMastery).filter((v): v is number => v !== null)),
    averageTestScore: mean(dossiers.map((d) => d.tests.averageScore).filter((v): v is number => v !== null)),
    activeMisconceptions: dossiers.reduce((a, d) => a + d.activeMisconceptions.length, 0),
    commonMisconceptions: Array.from(common.values())
      .map((c) => ({ title: c.title, students: c.names.size, occurrences: c.occurrences, names: Array.from(c.names) }))
      .sort((a, b) => b.students - a.students || b.occurrences - a.occurrences)
      .slice(0, 12),
    weakestTopics: Array.from(topics.entries())
      .map(([topic, values]) => ({ topic, averageMastery: mean(values) as number, students: values.length }))
      .sort((a, b) => a.averageMastery - b.averageMastery)
      .slice(0, 8),
    needsAttention,
    strongest: dossiers
      .filter((d) => d.overallMastery !== null)
      .sort((a, b) => (b.overallMastery as number) - (a.overallMastery as number))
      .slice(0, 3)
      .map((d) => ({ name: d.name, overallMastery: d.overallMastery as number })),
  };
}

// ---------------------------------------------------------------------------
// Question understanding
// ---------------------------------------------------------------------------
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const CLASS_WORDS = /\b(class|all|everyone|everybody|mentees|students|average|averages|overall|cohort|group|whole)\b/;

/** Students whose full name, first name or last name appears in the question. */
export function findMentioned(question: string, roster: RosterEntry[]): RosterEntry[] {
  const q = ` ${norm(question)} `;
  return roster.filter((r) => {
    const name = norm(r.name.replace(/\(.*?\)/g, ""));
    if (!name) return false;
    if (q.includes(` ${name} `)) return true;
    return name.split(" ").some((part) => part.length >= 3 && q.includes(` ${part} `));
  });
}

export type Scope = "student" | "compare" | "class";

export function decideScope(question: string, students: RosterEntry[]): { scope: Scope; includeClass: boolean } {
  const mentionsClass = CLASS_WORDS.test(norm(question));
  if (students.length >= 2) return { scope: "compare", includeClass: mentionsClass };
  if (students.length === 1) return { scope: "student", includeClass: mentionsClass };
  return { scope: "class", includeClass: true };
}

/** Complete view of student misconception logs and metrics for RAG context. */
export const compactDossier = (d: StudentDossier) => ({
  name: d.name,
  sample: d.sample,
  overallMastery: d.overallMastery,
  averageTestScore: d.tests.averageScore,
  activeMisconceptionCount: d.activeMisconceptions.length,
  activeMisconceptions: d.activeMisconceptions.map((m) => ({
    title: m.title,
    topic: m.topic,
    occurrences: m.occurrences,
    status: m.status,
    flagged: m.flaggedForTeacher,
  })),
  resolvedMisconceptionCount: d.resolvedMisconceptions.length,
  resolvedMisconceptions: d.resolvedMisconceptions.map((m) => ({
    title: m.title,
    topic: m.topic,
    resolvedOn: m.resolvedOn,
  })),
  weakestTopic: d.weakTopics[0] || null,
  lastActive: d.lastActive,
});

// ---------------------------------------------------------------------------
// Generation (backend)
// ---------------------------------------------------------------------------
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export async function askInsights(
  params: { question: string; scope: Scope; context: Record<string, unknown>; history: { role: "user" | "assistant"; content: string }[] },
  teacherUid?: string
): Promise<{ answer: string; provider: string }> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/teacher/insights/ask/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer mock-${teacherUid || "teacher"}` },
      body: JSON.stringify(params),
    });
  } catch {
    throw new TutorError("Can't reach the Eduvia server. Check that the backend is running.", "network");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 429) throw new TutorError("You're asking a bit fast. Wait a moment and try again.", "rate_limited");
    throw new TutorError(data.error || `Request failed (${res.status}).`, data.code);
  }
  return data;
}

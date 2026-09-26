/**
 * The student's adaptive-learning profile:
 * - per-topic mastery with history          users/{uid}/data/topic_mastery
 * - resumable learning sessions             users/{uid}/data/learning_session
 * - misconception resolution tracking       misconceptions/{id}
 * plus the next-topic recommender and the cognitive report built from them.
 */
import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { AiMisconceptionRecord, REPEAT_THRESHOLD } from "./dataService";
import { CURRICULUM, resolveTopic } from "../data/curriculum";
import { Difficulty, GeneratedTest, MisconceptionRef, OpenEvaluation, OpenProblem } from "./tutorService";
import { AcademicTier, MisconceptionStatus, StudentMisconceptionRecord } from "../types";

/** Consecutive sound answers in targeted practice needed to resolve a misconception. */
export const RESOLVE_STREAK = 2;

const withTimeout = <T,>(promise: Promise<T>, ms = 10000): Promise<T> =>
  Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms))]);

// Firestore rejects `undefined`; a JSON round-trip drops those fields.
const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const stamp = () => new Date().toISOString().replace("T", " ").substring(0, 16);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const parseStamp = (s?: string) => (s ? new Date(s.includes("T") ? s : `${s.replace(" ", "T")}Z`) : null);
const daysSince = (s?: string) => {
  const d = parseStamp(s);
  return d ? Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000)) : null;
};
export const slugKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "unspecified";

// ---------------------------------------------------------------------------
// Topic mastery
// ---------------------------------------------------------------------------
export interface TopicMastery {
  topicId: string;
  subject: string;
  topic: string;
  mastery: number;
  attempts: number;
  correct: number;
  lastPracticed: string;
  history: { date: string; mastery: number }[];
}
export type TopicMasteryMap = Record<string, TopicMastery>;

// Bayesian Knowledge Tracing, same parameters as the backend (slip 0.10, guess 0.20, learn 0.10).
export const bktUpdate = (m: number, correct: boolean) => {
  const slip = 0.1;
  const guess = 0.2;
  const post = correct ? (m * (1 - slip)) / (m * (1 - slip) + (1 - m) * guess) : (m * slip) / (m * slip + (1 - m) * (1 - guess));
  return Math.max(0.02, Math.min(0.98, post + (1 - post) * 0.1));
};

const masteryRef = (uid: string) => doc(db, "users", uid, "data", "topic_mastery");
const sessionRef = (uid: string) => doc(db, "users", uid, "data", "learning_session");

export const learningService = {
  async getTopicMastery(uid: string): Promise<TopicMasteryMap> {
    const snap = await withTimeout(getDoc(masteryRef(uid)));
    return snap.exists() ? ((snap.data().topics as TopicMasteryMap) || {}) : {};
  },

  /** Folds a batch of right/wrong outcomes for one topic into its mastery and history. */
  async recordTopicEvidence(uid: string, topicName: string, subject: string, outcomes: boolean[]): Promise<TopicMastery | null> {
    if (outcomes.length === 0) return null;
    const topic = resolveTopic(topicName, subject);
    const existing = (await this.getTopicMastery(uid))[topic.id];
    let mastery = existing?.mastery ?? 0.5;
    outcomes.forEach((ok) => (mastery = bktUpdate(mastery, ok)));
    const date = today();
    const history = [...(existing?.history || []).filter((h) => h.date !== date), { date, mastery }].slice(-30);
    const next: TopicMastery = {
      topicId: topic.id,
      subject: topic.subject,
      topic: topic.name,
      mastery,
      attempts: (existing?.attempts || 0) + outcomes.length,
      correct: (existing?.correct || 0) + outcomes.filter(Boolean).length,
      lastPracticed: new Date().toISOString(),
      history,
    };
    await withTimeout(setDoc(masteryRef(uid), { topics: { [topic.id]: next } }, { merge: true }));
    return next;
  },

  // -------------------------------------------------------------------------
  // Sessions (Continue Learning)
  // -------------------------------------------------------------------------
  async getSessions(uid: string): Promise<Sessions> {
    const snap = await withTimeout(getDoc(sessionRef(uid)));
    return snap.exists() ? (snap.data() as Sessions) : {};
  },

  async saveSession(uid: string, slot: keyof Sessions, value: Sessions[keyof Sessions] | null): Promise<void> {
    await withTimeout(setDoc(sessionRef(uid), { [slot]: value ? clean(value) : null }, { merge: true }));
  },

  // -------------------------------------------------------------------------
  // Misconception resolution
  // -------------------------------------------------------------------------
  /**
   * Applies one graded open-ended answer to the misconception log.
   * Targeted practice: a pass extends the streak (RESOLVE_STREAK in a row resolves it), a miss resets it.
   * Any other misconception the answer revealed is recorded (and a resolved one re-opens).
   */
  async applyPracticeOutcome(
    uid: string,
    studentName: string,
    records: StudentMisconceptionRecord[],
    params: { topic: string; subject: string; focus?: MisconceptionRef | null; focusRecordId?: string; evaluation: OpenEvaluation }
  ): Promise<{ updated: AiMisconceptionRecord[]; resolved: AiMisconceptionRecord | null }> {
    const { evaluation, focus } = params;
    const now = stamp();
    const byId = (id: string) => records.find((r) => r.id === id) as (Partial<AiMisconceptionRecord> & StudentMisconceptionRecord) | undefined;
    const base = (id: string, m: MisconceptionRef): AiMisconceptionRecord => {
      const prev = byId(id);
      return {
        id,
        studentId: uid,
        studentName,
        source: "ai-test",
        conceptId: prev?.conceptId || `ai:${slugKey(params.topic)}`,
        conceptName: prev?.conceptName || params.topic,
        discipline: prev?.discipline || params.subject,
        identifiedMisconception: prev?.identifiedMisconception || m.title,
        misconceptionKey: prev?.misconceptionKey || m.key,
        explanation: prev?.explanation || m.explanation,
        status: prev?.status || "Detected",
        firstDetected: prev?.firstDetected || now,
        lastAttempt: now,
        attemptCount: prev?.attemptCount || 0,
        flagged: false,
        remedialInterventionTitle: prev?.remedialInterventionTitle || `Targeted practice: ${m.title}`,
        resolutionTimestamp: prev?.resolutionTimestamp || "",
        practiceStreak: prev?.practiceStreak || 0,
        resolvedCount: prev?.resolvedCount || 0,
        origin: prev?.origin || "open-practice",
      };
    };
    const finalise = (r: AiMisconceptionRecord) => ({ ...r, flagged: r.attemptCount >= REPEAT_THRESHOLD && r.status !== "Resolved" });

    const updated: AiMisconceptionRecord[] = [];
    let resolved: AiMisconceptionRecord | null = null;

    if (focus) {
      const id = params.focusRecordId || `${uid}__ai__${focus.key}`;
      const rec = base(id, focus);
      const wasResolved = rec.status === "Resolved";
      if (evaluation.passed && wasResolved) {
        // Retention check on an already-resolved misconception: confirms it, nothing new to resolve.
        rec.practiceStreak = (rec.practiceStreak || 0) + 1;
      } else if (evaluation.passed) {
        rec.practiceStreak = (rec.practiceStreak || 0) + 1;
        if (rec.practiceStreak >= RESOLVE_STREAK) {
          rec.status = "Resolved";
          rec.resolutionTimestamp = new Date().toISOString();
          rec.resolvedCount = (rec.resolvedCount || 0) + 1;
          resolved = finalise(rec);
        } else {
          rec.status = "Re-Evaluating";
        }
      } else {
        rec.practiceStreak = 0;
        rec.status = "Remediating";
        rec.resolutionTimestamp = "";
        if (evaluation.misconception?.key === focus.key) rec.attemptCount += 1;
      }
      updated.push(finalise(rec));
    }

    const found = evaluation.misconception;
    if (found && (!focus || found.key !== focus.key)) {
      const id = `${uid}__ai__${found.key}`;
      const rec = base(id, found);
      rec.attemptCount += 1;
      rec.practiceStreak = 0;
      rec.status = rec.status === "Resolved" ? "Detected" : (rec.status as MisconceptionStatus);
      rec.resolutionTimestamp = "";
      updated.push(finalise(rec));
    }

    if (updated.length) {
      const batch = writeBatch(db);
      updated.forEach((r) => batch.set(doc(db, "misconceptions", r.id), clean(r), { merge: true }));
      await withTimeout(batch.commit());
    }
    return { updated, resolved };
  },
};

// ---------------------------------------------------------------------------
// Session shapes
// ---------------------------------------------------------------------------
export interface OpenPracticeItem {
  problem: OpenProblem;
  token: string;
  difficulty: Difficulty;
  answer: string;
  reasoning: string;
  evaluation?: OpenEvaluation;
}

export interface OpenPracticeSession {
  kind: "open-practice";
  subject: string;
  topic: string;
  difficulty: Difficulty;
  focus: MisconceptionRef | null;
  focusRecordId?: string;
  items: OpenPracticeItem[];
  streak: number;
  resolved: boolean;
  updatedAt: string;
}

export interface McqTestSession {
  kind: "mcq-test";
  subject: string;
  topic: string;
  test: GeneratedTest;
  answers: Record<string, string>;
  current: number;
  updatedAt: string;
}

export interface DiagnosticSession {
  kind: "diagnostic";
  challengeId: string;
  topic: string;
  stage: number;
  selectedOptionId: string | null;
  verificationAnswer: string | null;
  updatedAt: string;
}

export type AnySession = OpenPracticeSession | McqTestSession | DiagnosticSession;
export interface Sessions {
  practice?: OpenPracticeSession | null;
  test?: McqTestSession | null;
  diagnostic?: DiagnosticSession | null;
}

/** The unfinished activity the student touched most recently. */
export const latestSession = (s: Sessions): AnySession | null =>
  [s.practice, s.test, s.diagnostic]
    .filter((x): x is AnySession => !!x)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))[0] || null;

export const describeSession = (s: AnySession) => {
  if (s.kind === "mcq-test") {
    const answered = Object.keys(s.answers).length;
    return { title: `${s.topic} quick test`, detail: `${answered} of ${s.test.questions.length} answered`, hash: "#ai-tutor" };
  }
  if (s.kind === "open-practice") {
    return {
      title: s.focus ? `Targeted practice: ${s.focus.title}` : `${s.topic} practice`,
      detail: s.focus ? `${s.streak}/${RESOLVE_STREAK} correct in a row` : `${s.items.filter((i) => i.evaluation).length} problems done`,
      hash: "#ai-tutor",
    };
  }
  return { title: `${s.topic} diagnostic`, detail: `Step ${Math.min(s.stage + 1, 5)} of 5`, hash: "#diagnostic" };
};

// ---------------------------------------------------------------------------
// Adaptive topic selection
// ---------------------------------------------------------------------------
export interface Recommendation {
  topicId: string;
  subject: string;
  topic: string;
  score: number;
  reason: string;
  focus?: { recordId: string; ref: MisconceptionRef };
}

const isActive = (r: StudentMisconceptionRecord) => r.status !== "Resolved";
const refFor = (r: StudentMisconceptionRecord): MisconceptionRef => {
  const ai = r as Partial<AiMisconceptionRecord>;
  return {
    key: ai.misconceptionKey || slugKey(r.identifiedMisconception),
    title: r.identifiedMisconception,
    explanation: ai.explanation || r.remedialInterventionTitle || "",
  };
};

/**
 * Ranks topics by how much attention they need: active misconceptions first, then low mastery,
 * then topics going stale; new topics matching the student's level fill the gaps.
 */
export const recommendTopics = (
  mastery: TopicMasteryMap,
  records: StudentMisconceptionRecord[],
  tier?: AcademicTier,
  limit = 3
): Recommendation[] => {
  const byTopic = new Map<string, StudentMisconceptionRecord[]>();
  records.filter(isActive).forEach((r) => {
    const id = resolveTopic(r.conceptName, r.discipline).id;
    byTopic.set(id, [...(byTopic.get(id) || []), r]);
  });
  const engagedSubjects = new Set([...Object.values(mastery).map((m) => m.subject), ...records.map((r) => r.discipline as string)]);

  const candidates = new Map<string, { subject: string; topic: string; tier?: AcademicTier }>();
  CURRICULUM.forEach((c) => candidates.set(c.id, { subject: c.subject, topic: c.name, tier: c.tier }));
  Object.values(mastery).forEach((m) => !candidates.has(m.topicId) && candidates.set(m.topicId, { subject: m.subject, topic: m.topic }));
  records.forEach((r) => {
    const t = resolveTopic(r.conceptName, r.discipline);
    if (!candidates.has(t.id)) candidates.set(t.id, { subject: t.subject, topic: t.name });
  });

  const scored: Recommendation[] = [];
  candidates.forEach((c, topicId) => {
    const active = (byTopic.get(topicId) || []).sort((a, b) => b.attemptCount - a.attemptCount);
    const m = mastery[topicId];
    let score = 0;
    let reason = "";
    if (active.length) {
      score += Math.min(70, active.length * 35) + (active.some((r) => (r as Partial<AiMisconceptionRecord>).flagged) ? 15 : 0);
      reason = `Active misconception: "${active[0].identifiedMisconception}"`;
    }
    if (m) {
      const days = daysSince(m.lastPracticed) ?? 0;
      score += (1 - m.mastery) * 50;
      if (days >= 3) score += Math.min(20, days * 2);
      if (m.mastery >= 0.85 && days < 3) score -= 40;
      if (!reason) reason = m.mastery < 0.6 ? `Mastery ${Math.round(m.mastery * 100)}%, needs work` : `Not practised for ${days} day${days === 1 ? "" : "s"}`;
    } else if (!active.length) {
      score += 10 + (tier && c.tier === tier ? 10 : 0) + (engagedSubjects.has(c.subject) ? 8 : 0);
      reason = `New topic in ${c.subject}`;
    }
    scored.push({
      topicId,
      subject: c.subject,
      topic: c.topic,
      score,
      reason,
      focus: active.length ? { recordId: active[0].id, ref: refFor(active[0]) } : undefined,
    });
  });

  // Keep the list varied: at most two picks from the same subject.
  const picks: Recommendation[] = [];
  const perSubject: Record<string, number> = {};
  for (const r of scored.sort((a, b) => b.score - a.score)) {
    if ((perSubject[r.subject] || 0) >= 2) continue;
    picks.push(r);
    perSubject[r.subject] = (perSubject[r.subject] || 0) + 1;
    if (picks.length === limit) break;
  }
  return picks;
};

// ---------------------------------------------------------------------------
// Cognitive diagnostic report
// ---------------------------------------------------------------------------
export interface CognitiveReport {
  topics: TopicMastery[];
  strong: TopicMastery[];
  weak: TopicMastery[];
  active: StudentMisconceptionRecord[];
  resolved: StudentMisconceptionRecord[];
  progress: { date: string; mastery: number }[];
  overallMastery: number | null;
}

export const buildReport = (mastery: TopicMasteryMap, records: StudentMisconceptionRecord[]): CognitiveReport => {
  const topics = Object.values(mastery).sort((a, b) => b.mastery - a.mastery);
  const dates = Array.from(new Set(topics.flatMap((t) => t.history.map((h) => h.date)))).sort();
  // Overall mastery on each day = mean of every topic's latest known mastery up to that day.
  const progress = dates.map((date) => {
    const values = topics
      .map((t) => [...t.history].filter((h) => h.date <= date).pop()?.mastery)
      .filter((v): v is number => typeof v === "number");
    return { date, mastery: values.reduce((a, b) => a + b, 0) / Math.max(1, values.length) };
  });
  return {
    topics,
    strong: topics.filter((t) => t.mastery >= 0.75 && t.attempts >= 2),
    weak: topics.filter((t) => t.mastery < 0.5).sort((a, b) => a.mastery - b.mastery),
    active: records.filter(isActive).sort((a, b) => b.attemptCount - a.attemptCount),
    resolved: records.filter((r) => !isActive(r)),
    progress,
    overallMastery: topics.length ? topics.reduce((a, t) => a + t.mastery, 0) / topics.length : null,
  };
};

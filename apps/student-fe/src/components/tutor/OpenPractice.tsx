import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Target,
  Sparkles,
  MessageSquare,
  Trophy,
  Square,
} from "lucide-react";
import { SUBJECTS, CURRICULUM, resolveTopic } from "../../data/curriculum";
import { Difficulty, MisconceptionRef, openProblemService, TutorError, OpenEvaluation } from "../../services/tutorService";
import {
  learningService,
  OpenPracticeItem,
  OpenPracticeSession,
  Recommendation,
  RESOLVE_STREAK,
  TopicMastery,
} from "../../services/learningService";
import { AiMisconceptionRecord } from "../../services/dataService";
import { StudentMisconceptionRecord } from "../../types";
import { PhaseChip } from "../diagnostic/DiagnosticTemplate";

export interface PracticeStart {
  subject: string;
  topic: string;
  focus?: { recordId: string; ref: MisconceptionRef } | null;
}

interface OpenPracticeProps {
  uid?: string;
  studentName: string;
  records: StudentMisconceptionRecord[];
  onRecordsUpdated: (updated: AiMisconceptionRecord[]) => void;
  onMasteryUpdated: (m: TopicMastery) => void;
  recommendations: Recommendation[];
  session: OpenPracticeSession | null;
  onSessionChange: (s: OpenPracticeSession | null) => void;
  pendingStart: PracticeStart | null;
  onPendingHandled: () => void;
  onAskTutor: (message: string, topic: string) => void;
}

const LEVELS: Difficulty[] = ["easy", "medium", "hard"];
const card = "rounded-[28px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]";
const primaryBtn =
  "h-11 px-6 rounded-full bg-brand hover:bg-brand-strong text-white text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed";
const secondaryBtn =
  "h-11 px-5 rounded-full bg-fill-2 hover:bg-fill-hover text-[#141414] text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50";
const QUALITY_LABEL: Record<OpenEvaluation["reasoning_quality"], string> = {
  sound: "Sound reasoning",
  partial: "Partly right reasoning",
  flawed: "Flawed reasoning",
  missing: "No reasoning given",
};

export const OpenPractice: React.FC<OpenPracticeProps> = ({
  uid,
  studentName,
  records,
  onRecordsUpdated,
  onMasteryUpdated,
  recommendations,
  session,
  onSessionChange,
  pendingStart,
  onPendingHandled,
  onAskTutor,
}) => {
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [busy, setBusy] = useState<"generating" | "grading" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState(false);

  const known = records
    .map((r) => {
      const ai = r as Partial<AiMisconceptionRecord>;
      return ai.misconceptionKey ? { key: ai.misconceptionKey, title: r.identifiedMisconception } : null;
    })
    .filter((x): x is { key: string; title: string } => !!x)
    .slice(0, 20);

  const streakFor = (recordId?: string) =>
    (records.find((r) => r.id === recordId) as Partial<AiMisconceptionRecord> | undefined)?.practiceStreak || 0;

  const fetchProblem = async (base: {
    subject: string;
    topic: string;
    difficulty: Difficulty;
    focus: MisconceptionRef | null;
    avoid: string[];
  }): Promise<OpenPracticeItem | null> => {
    setBusy("generating");
    setError(null);
    try {
      const set = await openProblemService.generate({ ...base, known_misconceptions: known }, uid);
      return { problem: set.problems[0], token: set.token, difficulty: set.difficulty, answer: "", reasoning: "" };
    } catch (err) {
      setError(err instanceof TutorError ? err.message : "Couldn't create a problem. Please try again.");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const start = async (s: PracticeStart, level: Difficulty = difficulty) => {
    const t = resolveTopic(s.topic, s.subject);
    const focus = s.focus?.ref || null;
    const item = await fetchProblem({ subject: t.subject, topic: t.name, difficulty: level, focus, avoid: [] });
    if (!item) return;
    onSessionChange({
      kind: "open-practice",
      subject: t.subject,
      topic: t.name,
      difficulty: level,
      focus,
      focusRecordId: s.focus?.recordId,
      items: [item],
      streak: focus ? streakFor(s.focus?.recordId) : 0,
      resolved: false,
      updatedAt: new Date().toISOString(),
    });
  };

  // Deep links (recommendations, misconception log): targeted ones start right away,
  // plain topics are pre-selected in the setup form.
  useEffect(() => {
    if (!pendingStart || session) return;
    setSubject(pendingStart.subject);
    setTopic(pendingStart.topic);
    onPendingHandled();
    if (pendingStart.focus) start(pendingStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStart]);

  const current = session?.items[session.items.length - 1];

  const updateCurrent = (patch: Partial<OpenPracticeItem>) => {
    if (!session || !current) return;
    onSessionChange({ ...session, items: [...session.items.slice(0, -1), { ...current, ...patch }], updatedAt: new Date().toISOString() });
  };

  const submit = async () => {
    if (!session || !current || !current.answer.trim()) return;
    setBusy("grading");
    setError(null);
    let evaluation: OpenEvaluation;
    try {
      evaluation = await openProblemService.evaluate(current.token, current.problem.id, current.answer, current.reasoning, uid);
    } catch (err) {
      setError(err instanceof TutorError ? err.message : "Couldn't grade your answer. Please try again.");
      setBusy(null);
      return;
    }
    let streak = session.streak;
    let resolved = false;
    let focus = session.focus;
    let focusRecordId = session.focusRecordId;
    setSaveWarning(false);
    if (uid) {
      try {
        const outcome = await learningService.applyPracticeOutcome(uid, studentName, records, {
          topic: session.topic,
          subject: session.subject,
          focus: session.focus,
          focusRecordId: session.focusRecordId,
          evaluation,
        });
        onRecordsUpdated(outcome.updated);
        const focusRec = outcome.updated.find((r) => r.misconceptionKey === session.focus?.key || r.id === session.focusRecordId);
        if (session.focus) streak = focusRec?.practiceStreak ?? (evaluation.passed ? streak + 1 : 0);
        resolved = !!outcome.resolved;
        // Detected a misconception outside targeted mode: the next problems target it.
        if (!session.focus && evaluation.misconception) {
          focus = evaluation.misconception;
          focusRecordId = `${uid}__ai__${evaluation.misconception.key}`;
          streak = 0;
        }
        const m = await learningService.recordTopicEvidence(uid, session.topic, session.subject, [evaluation.passed]);
        if (m) onMasteryUpdated(m);
      } catch (err) {
        console.warn("[Practice] Failed to save progress:", err);
        setSaveWarning(true);
      }
    }
    onSessionChange({
      ...session,
      items: [...session.items.slice(0, -1), { ...current, evaluation }],
      streak,
      resolved,
      focus,
      focusRecordId,
      updatedAt: new Date().toISOString(),
    });
    setBusy(null);
  };

  const next = async () => {
    if (!session || !current?.evaluation) return;
    const idx = LEVELS.indexOf(current.difficulty);
    const level = current.evaluation.passed ? LEVELS[Math.min(2, idx + 1)] : LEVELS[Math.max(0, idx - 1)];
    const item = await fetchProblem({
      subject: session.subject,
      topic: session.topic,
      difficulty: level,
      focus: session.focus,
      avoid: session.items.slice(-5).map((i) => i.problem.prompt),
    });
    if (!item) return;
    onSessionChange({ ...session, difficulty: level, items: [...session.items, item].slice(-12), updatedAt: new Date().toISOString() });
  };

  // ------------------------------------------------------------------ setup
  if (!session) {
    const topics = CURRICULUM.filter((c) => c.subject === subject);
    return (
      <div className="space-y-6">
        {recommendations.length > 0 && (
          <section className={`${card} p-6`} aria-labelledby="recommended-title">
            <h2 id="recommended-title" className="flex items-center gap-2 font-display text-lg font-bold text-[#141414]">
              <Sparkles className="w-4 h-4 text-brand" /> Recommended for you
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {recommendations.map((r) => (
                <button
                  key={r.topicId}
                  onClick={() => start({ subject: r.subject, topic: r.topic, focus: r.focus })}
                  disabled={!!busy}
                  className="rounded-2xl border border-[#E3E3E1] p-4 text-left hover:border-brand hover:bg-brand-faint transition disabled:opacity-50"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand">{r.subject}</span>
                  <span className="mt-1 block font-bold text-[#141414]">{r.topic}</span>
                  <span className="adhd-hide mt-1 block text-xs text-[#6B6B6B]">{r.reason}</span>
                  {r.focus && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#FAD4D4] px-2 py-0.5 text-[10px] font-bold text-[#8F1D1D]">
                      <Target className="w-3 h-3" /> Targeted practice
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className={`${card} p-6 sm:p-8 space-y-6`} aria-labelledby="practice-setup-title">
          <div>
            <PhaseChip tone="purple" icon={Sparkles}>Open-ended problems</PhaseChip>
            <h2 id="practice-setup-title" className="mt-3 font-display text-2xl font-bold text-[#141414]">Practise by explaining your thinking</h2>
            <p className="adhd-hide mt-1 text-sm text-[#6B6B6B]">
              Each problem asks for your answer <strong>and</strong> your reasoning. The AI checks both, spots misconceptions, and adapts the next problem.
            </p>
          </div>
          <fieldset>
            <legend className="text-sm font-bold text-[#141414]">Subject</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={subject === s}
                  onClick={() => {
                    setSubject(s);
                    setTopic("");
                  }}
                  className={`h-9 px-4 rounded-full text-xs font-semibold transition ${subject === s ? "bg-[#141414] text-white" : "bg-fill-2 hover:bg-fill-hover"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-bold text-[#141414]">Topic</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {topics.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={topic === c.name}
                  onClick={() => setTopic(c.name)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    topic === c.name ? "border-brand bg-brand-faint ring-2 ring-brand/30" : "border-[#E3E3E1] hover:border-brand"
                  }`}
                >
                  <span className="block text-sm font-bold text-[#141414]">{c.name}</span>
                  <span className="adhd-hide block text-xs text-[#6B6B6B]">{c.tier} · {c.summary}</span>
                </button>
              ))}
            </div>
            <label htmlFor="custom-topic" className="sr-only">Or type another topic</label>
            <input
              id="custom-topic"
              value={topics.some((c) => c.name === topic) ? "" : topic}
              onChange={(e) => setTopic(e.target.value.slice(0, 120))}
              placeholder={`Or type another ${subject} topic…`}
              className="mt-2 h-11 w-full rounded-2xl border border-black/10 bg-fill px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </fieldset>
          <fieldset>
            <legend className="text-sm font-bold text-[#141414]">Starting difficulty</legend>
            <div className="mt-2 flex gap-2">
              {LEVELS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={difficulty === d}
                  onClick={() => setDifficulty(d)}
                  className={`h-10 px-5 rounded-full text-sm font-semibold capitalize transition ${difficulty === d ? "bg-[#141414] text-white" : "bg-fill-2 hover:bg-fill-hover"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#7F1D1D]">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
          <button onClick={() => start({ subject, topic })} disabled={!topic.trim() || !!busy} className={`${primaryBtn} w-full sm:w-auto`}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {busy ? "Writing your problem…" : "Start practice"} {!busy && <ArrowRight className="w-4 h-4" />}
          </button>
        </section>
      </div>
    );
  }

  // --------------------------------------------------------------- practice
  const evaluation = current?.evaluation;
  const done = session.items.filter((i) => i.evaluation).length;
  return (
    <div className="space-y-5">
      <section className={`${card} p-6 sm:p-8`} aria-labelledby="problem-title">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-5">
          <div className="min-w-0">
            <h2 id="problem-title" className="font-display font-bold text-base text-[#141414]">
              Problem {session.items.length} · {session.topic}
            </h2>
            <p className="adhd-hide text-xs text-[#6B6B6B]">
              {session.subject} · <span className="capitalize">{current?.difficulty}</span> · {done} answered
              {current && ` · ${current.problem.approach.replace(/-/g, " ")} problem`}
            </p>
          </div>
          <button
            onClick={() => onSessionChange(null)}
            className="h-9 px-3.5 rounded-full bg-fill-2 hover:bg-fill-hover text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Square className="w-3 h-3" /> End practice
          </button>
        </div>

        {session.focus && (
          <div className="mt-5 rounded-2xl bg-brand-faint p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-bold text-[#2A1B6B]">
                <Target className="w-4 h-4" /> Targeted practice: {session.focus.title}
              </span>
              <span className="text-xs font-semibold text-brand-ink">
                {session.resolved ? "Resolved" : `${session.streak}/${RESOLVE_STREAK} correct in a row to resolve`}
              </span>
            </div>
            <div className="mt-2 flex gap-1.5" aria-hidden="true">
              {Array.from({ length: RESOLVE_STREAK }).map((_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full ${i < session.streak ? "bg-[#10B981]" : "bg-[#D9D2FB]"}`} />
              ))}
            </div>
          </div>
        )}

        {session.resolved && evaluation ? (
          <div className="mt-6 text-center py-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#D6F5E6] grid place-items-center text-[#0F9D63]">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-bold text-[#141414]">Misconception resolved!</h3>
            <p className="adhd-clamp mt-2 text-sm text-[#5B5B5B] max-w-md mx-auto">
              You showed sound reasoning on {RESOLVE_STREAK} problems in a row, so "{session.focus?.title}" is now marked resolved in your cognitive profile.
            </p>
            {(() => {
              const nextRec = recommendations.find((r) => r.topicId !== resolveTopic(session.topic, session.subject).id);
              return (
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {nextRec && (
                    <button
                      onClick={() => {
                        onSessionChange(null);
                        start({ subject: nextRec.subject, topic: nextRec.topic, focus: nextRec.focus });
                      }}
                      className={primaryBtn}
                    >
                      Next: {nextRec.topic} <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => onSessionChange({ ...session, focus: null, focusRecordId: undefined, resolved: false, streak: 0 })} className={secondaryBtn}>
                    Keep practising {session.topic}
                  </button>
                </div>
              );
            })()}
          </div>
        ) : current ? (
          <>
            <p className="mt-6 text-base sm:text-lg font-semibold leading-relaxed text-[#141414] whitespace-pre-wrap">{current.problem.prompt}</p>

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="final-answer" className="text-sm font-bold text-[#141414]">Your final answer</label>
                <input
                  id="final-answer"
                  value={current.answer}
                  onChange={(e) => updateCurrent({ answer: e.target.value.slice(0, 1000) })}
                  disabled={!!evaluation || !!busy}
                  placeholder="e.g. 0.2"
                  className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-fill px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-70"
                />
              </div>
              <div>
                <label htmlFor="reasoning" className="text-sm font-bold text-[#141414]">Your reasoning</label>
                <p className="adhd-hide text-xs text-[#6B6B6B]">Explain how you got there. Your reasoning counts as much as the answer.</p>
                <textarea
                  id="reasoning"
                  value={current.reasoning}
                  onChange={(e) => updateCurrent({ reasoning: e.target.value.slice(0, 3000) })}
                  disabled={!!evaluation || !!busy}
                  rows={5}
                  placeholder="Step by step, why is this the answer?"
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-fill px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-70"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="mt-4 flex items-center gap-2 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#7F1D1D]">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              </p>
            )}

            {!evaluation ? (
              <div className="mt-5 flex justify-end">
                <button onClick={submit} disabled={!current.answer.trim() || !!busy} className={primaryBtn}>
                  {busy === "grading" ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking your reasoning…</> : <>Submit for feedback <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4" aria-live="polite">
                <div className={`rounded-2xl p-4 ${evaluation.passed ? "bg-[#E7F8F0]" : "bg-[#FDECEC]"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`flex items-center gap-2 font-bold ${evaluation.passed ? "text-[#065F46]" : "text-[#7F1D1D]"}`}>
                      {evaluation.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      {evaluation.passed ? "Correct, with sound reasoning" : evaluation.answer_correct ? "Right answer, but the reasoning needs work" : "Not quite"}
                    </span>
                    <span className="text-xs font-bold text-[#141414]">
                      {evaluation.score}/100 · {QUALITY_LABEL[evaluation.reasoning_quality]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#1F1F1F]">{evaluation.feedback}</p>
                </div>

                {evaluation.misconception && (
                  <div className="rounded-2xl bg-[#FFF7E6] p-4 text-sm text-[#5C4200]">
                    <strong>Misconception spotted: {evaluation.misconception.title}.</strong> {evaluation.misconception.explanation}
                    {!session.focus || session.focus.key === evaluation.misconception.key ? (
                      <span className="adhd-hide block mt-1 text-xs">The next problems will target this, using a different approach each time.</span>
                    ) : null}
                  </div>
                )}

                {evaluation.gaps.length > 0 && (
                  <div className="adhd-hide text-sm text-[#4B4B4B]">
                    <strong className="text-[#141414]">Gaps to work on:</strong>
                    <ul className="mt-1 list-disc pl-5">{evaluation.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
                  </div>
                )}

                <details className="rounded-2xl border border-[#E3E3E1] p-4 text-sm">
                  <summary className="cursor-pointer font-bold text-[#141414]">Show the model solution</summary>
                  <p className="mt-2"><strong>Answer:</strong> {evaluation.reference_answer}</p>
                  {evaluation.key_reasoning.length > 0 && (
                    <ol className="mt-2 list-decimal pl-5 space-y-1">{evaluation.key_reasoning.map((s, i) => <li key={i}>{s}</li>)}</ol>
                  )}
                </details>

                {saveWarning && (
                  <p role="alert" className="rounded-2xl bg-[#FDECEC] px-4 py-3 text-xs text-[#7F1D1D]">
                    Your answer was graded, but we couldn't save your progress. It will be retried on your next answer.
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    onClick={() =>
                      onAskTutor(
                        `I'm practising ${session.topic}. The problem was:\n${current.problem.prompt}\n\nI answered "${current.answer}" because: ${current.reasoning || "(no reasoning)"}\n\nThe feedback was: ${evaluation.feedback}\nCan you help me understand this better?`,
                        session.topic
                      )
                    }
                    className={secondaryBtn}
                  >
                    <MessageSquare className="w-4 h-4" /> Ask the tutor
                  </button>
                  <button onClick={next} disabled={!!busy} className={primaryBtn}>
                    {busy === "generating" ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing next problem…</> : <>Next problem <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </section>
    </div>
  );
};

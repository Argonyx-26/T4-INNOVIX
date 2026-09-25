import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Layers,
  Loader2,
  Volume2,
  ExternalLink,
  HelpCircle,
  BookOpen,
  Clock,
  RotateCcw,
} from "lucide-react";
import { useThemeMode } from "../context/ThemeModeContext";
import { useAuth } from "../context/AuthContext";
import { ADHDDiagnosticView } from "./ADHDDiagnosticView";
import { DyslexicDiagnosticView } from "./DyslexicDiagnosticView";
import { InteractiveMindMap } from "../components/InteractiveMindMap";
import {
  StepCard,
  PhaseChip,
  AnswerOption,
  LearnerModelPanel,
  LearnerModelView,
  MistakeMemoryPanel,
} from "../components/diagnostic/DiagnosticTemplate";
import { dataService, LearnerModelState } from "../services/dataService";
import {
  ConceptChallenge,
  DiagnosticOption,
  EducationalResource,
  MisconceptionStatus,
  StudentMisconceptionRecord,
} from "../types";

export const PENDING_CHALLENGE_KEY = "eduvia_pending_challenge";

const STEPS = [
  { title: "Step 1: Diagnostic Question", subtitle: "Your answer reveals how you're thinking about the concept" },
  { title: "Step 2: Misconception Diagnosis", subtitle: "Why that answer happened" },
  { title: "Step 3: Targeted Micro-Lesson", subtitle: "A 60-second reframe of the rule" },
  { title: "Step 4: Concept Verification Test", subtitle: "Testing the same concept in a new context" },
];

const clamp = (v: number) => Math.max(0.02, Math.min(0.98, v));

// Bayesian Knowledge Tracing update (same slip/guess parameters as the backend).
const bkt = (m: number, correct: boolean, learn = 0.1) => {
  const slip = 0.1;
  const guess = 0.2;
  const post = correct ? (m * (1 - slip)) / (m * (1 - slip) + (1 - m) * guess) : (m * slip) / (m * slip + (1 - m) * (1 - guess));
  return clamp(post + (1 - post) * learn);
};

const freshState = (): LearnerModelState => ({
  mastery: 0.5,
  confidence: 0.5,
  retention: 0.8,
  misconceptionActive: false,
  lastEvent: "No attempts yet",
  updatedAt: new Date().toISOString(),
});

// Retention decays with time since the concept was last practised (Ebbinghaus-style).
const withDecay = (s: LearnerModelState): LearnerModelState => {
  const days = (Date.now() - new Date(s.updatedAt).getTime()) / 86_400_000;
  return days > 0.5 ? { ...s, retention: clamp(s.retention * Math.exp(-days / 14)) } : s;
};

const toView = (s: LearnerModelState): LearnerModelView => ({
  mastery: s.mastery,
  confidence: s.confidence,
  retention: s.retention,
  risk: s.misconceptionActive ? clamp(0.35 + 0.65 * (1 - s.mastery)) : clamp((1 - s.mastery) * 0.4),
  lastEvent: s.lastEvent,
});

const stamp = () => new Date().toISOString().replace("T", " ").substring(0, 16);

export const LearnLensDiagnostic: React.FC = () => {
  const { mode, speak, showToast } = useThemeMode();
  const { user } = useAuth();

  const [challenges, setChallenges] = useState<ConceptChallenge[]>([]);
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  // Initialisers must stay pure (Strict Mode runs them twice), so the key is cleared in an effect.
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(() => {
    try {
      return sessionStorage.getItem(PENDING_CHALLENGE_KEY) || "math-school-linear";
    } catch {
      return "math-school-linear";
    }
  });
  useEffect(() => {
    try {
      sessionStorage.removeItem(PENDING_CHALLENGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const [stage, setStage] = useState(0);
  const [selectedOption, setSelectedOption] = useState<DiagnosticOption | null>(null);
  const [verificationAnswer, setVerificationAnswer] = useState<string | null>(null);
  const [hintTier, setHintTier] = useState(0);
  const [showMindMap, setShowMindMap] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef(Date.now());

  const [models, setModels] = useState<Record<string, LearnerModelState>>({});
  const modelsRef = useRef(models);
  const [modelLoading, setModelLoading] = useState(true);
  const [memory, setMemory] = useState<StudentMisconceptionRecord[]>([]);
  const memoryRef = useRef(memory);

  useEffect(() => {
    Promise.all([dataService.getChallenges(), dataService.getResources()]).then(([chs, res]) => {
      setChallenges(chs);
      setResources(res);
      setLoadingData(false);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setModelLoading(false);
      return;
    }
    let cancelled = false;
    setModelLoading(true);
    Promise.all([
      dataService.getLearnerModel(user.uid).catch((err) => {
        console.warn("[Diagnostic] Could not load learner model:", err);
        return {} as Record<string, LearnerModelState>;
      }),
      dataService.getStudentMisconceptions(user.uid),
    ]).then(([loaded, logs]) => {
      if (cancelled) return;
      const decayed = Object.fromEntries(Object.entries(loaded).map(([k, v]) => [k, withDecay(v)]));
      modelsRef.current = decayed;
      setModels(decayed);
      memoryRef.current = logs;
      setMemory(logs);
      setModelLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const activeChallenge: ConceptChallenge | undefined =
    challenges.find((c) => c.id === selectedChallengeId) || challenges[0];

  useEffect(() => {
    timerRef.current = Date.now();
    setElapsedMs(0);
    if (stage !== 0) return;
    const id = setInterval(() => setElapsedMs(Date.now() - timerRef.current), 100);
    return () => clearInterval(id);
  }, [stage, selectedChallengeId]);

  const conceptState = activeChallenge ? models[activeChallenge.id] || freshState() : freshState();

  const updateModel = (update: (s: LearnerModelState) => Partial<LearnerModelState>) => {
    if (!activeChallenge) return;
    const id = activeChallenge.id;
    const prev = modelsRef.current[id] || freshState();
    const next: LearnerModelState = { ...prev, ...update(prev), updatedAt: new Date().toISOString() };
    modelsRef.current = { ...modelsRef.current, [id]: next };
    setModels(modelsRef.current);
    if (user) {
      dataService.saveLearnerModel(user.uid, id, next).catch((err) => console.warn("[Diagnostic] Failed to save learner model:", err));
    }
  };

  const recordMemory = (status: MisconceptionStatus, opts: { misconception?: string; bumpAttempt?: boolean } = {}) => {
    if (!user || !activeChallenge) return;
    const id = `${user.uid}__${activeChallenge.id}`;
    const existing = memoryRef.current.find((r) => r.id === id);
    const now = stamp();
    const record: StudentMisconceptionRecord = {
      id,
      conceptId: activeChallenge.id,
      conceptName: activeChallenge.topic,
      discipline: activeChallenge.discipline,
      identifiedMisconception: opts.misconception || existing?.identifiedMisconception || activeChallenge.topic,
      status,
      firstDetected: existing?.firstDetected || now,
      lastAttempt: now,
      attemptCount: (existing?.attemptCount || 0) + (opts.bumpAttempt ? 1 : 0),
      remedialInterventionTitle: activeChallenge.microLesson.title,
      resolutionTimestamp: status === "Resolved" ? new Date().toISOString() : "",
    };
    memoryRef.current = [record, ...memoryRef.current.filter((r) => r.id !== id)];
    setMemory(memoryRef.current);
    dataService.recordMisconception(user.uid, record).catch((err) => {
      console.warn("[Diagnostic] Failed to save misconception:", err);
      showToast("Couldn't Save Progress", "Your answer counted, but we couldn't reach the database.", "warning");
    });
  };

  const submitToBackend = async (answer: string, timeMs: number): Promise<number | null> => {
    if (!activeChallenge) return null;
    const studentId = user?.uid || "anonymous";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const res = await fetch(`${baseUrl}/assessments/submit/`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer mock-${studentId}` },
        body: JSON.stringify({
          student_id: studentId,
          concept_id: activeChallenge.discipline === "Computer Science" ? "binary_search" : "algebra",
          student_answer: answer,
          time_ms: timeMs,
          attempts: 1 + hintTier,
          prior_mastery: conceptState.mastery,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data.retention_score === "number" ? data.retention_score : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  const handleSelectOption = async (opt: DiagnosticOption) => {
    if (!activeChallenge || submitting) return;
    setSelectedOption(opt);
    setSubmitting(true);
    const timeMs = Date.now() - timerRef.current;
    const retention = await submitToBackend(opt.label.replace(/^[a-z]\s*=\s*/i, "").trim(), timeMs);

    if (opt.isCorrect) {
      updateModel((s) => ({
        mastery: bkt(s.mastery, true),
        confidence: clamp(s.confidence + (hintTier === 0 ? 0.15 : 0.05)),
        retention: retention !== null ? clamp(retention) : s.retention,
        lastEvent: `Correct answer: ${activeChallenge.topic}`,
      }));
    } else {
      updateModel((s) => ({
        mastery: bkt(s.mastery, false),
        confidence: clamp(s.confidence - 0.15 - 0.05 * hintTier),
        retention: retention !== null ? clamp(retention) : s.retention,
        misconceptionActive: true,
        lastEvent: `${opt.misconceptionTitle} in ${activeChallenge.domain}`,
      }));
      recordMemory("Detected", { misconception: opt.misconceptionTitle, bumpAttempt: true });
    }
    setSubmitting(false);
    setStage(1);
    if (mode === "dyslexic") speak(`Selected ${opt.label}. ${opt.isCorrect ? "Correct answer!" : opt.misconceptionTitle}`);
  };

  const startLesson = () => {
    if (!activeChallenge) return;
    updateModel(() => ({ lastEvent: `Micro-lesson started: ${activeChallenge.microLesson.ruleName}` }));
    if (selectedOption && !selectedOption.isCorrect) recordMemory("Remediating");
    setStage(2);
  };

  const startVerification = () => {
    if (!activeChallenge) return;
    if (stage === 2) {
      // Working through the lesson is a learning opportunity in the BKT sense.
      updateModel((s) => ({ mastery: clamp(s.mastery + (1 - s.mastery) * 0.2), lastEvent: `Micro-lesson completed: ${activeChallenge.microLesson.ruleName}` }));
    }
    if (conceptState.misconceptionActive || (selectedOption && !selectedOption.isCorrect)) recordMemory("Re-Evaluating");
    setVerificationAnswer(null);
    setStage(3);
  };

  const handleSelectVerification = (optId: string) => {
    if (!activeChallenge || verificationAnswer && activeChallenge.verification.options.find((o) => o.id === verificationAnswer)?.isCorrect) return;
    const opt = activeChallenge.verification.options.find((o) => o.id === optId);
    if (!opt) return;
    setVerificationAnswer(optId);
    const misconception = selectedOption?.misconceptionTitle || memoryRef.current.find((r) => r.conceptId === activeChallenge.id)?.identifiedMisconception;
    if (opt.isCorrect) {
      const hadMisconception = conceptState.misconceptionActive;
      updateModel((s) => ({
        mastery: bkt(s.mastery, true),
        confidence: clamp(s.confidence + 0.3),
        retention: clamp(s.retention + 0.08),
        misconceptionActive: false,
        lastEvent: hadMisconception && misconception
          ? `Resolved: ${misconception} via ${activeChallenge.microLesson.ruleName}`
          : `Verified: ${activeChallenge.topic}`,
      }));
      if (hadMisconception) recordMemory("Resolved");
    } else {
      updateModel((s) => ({
        mastery: bkt(s.mastery, false),
        confidence: clamp(s.confidence - 0.1),
        misconceptionActive: true,
        lastEvent: `Verification missed: ${activeChallenge.topic}`,
      }));
      recordMemory("Remediating", { misconception: misconception || "Verification error", bumpAttempt: true });
    }
  };

  const handleReset = () => {
    setStage(0);
    setSelectedOption(null);
    setVerificationAnswer(null);
    setHintTier(0);
    timerRef.current = Date.now();
    setElapsedMs(0);
  };

  const switchChallenge = (id: string) => {
    setSelectedChallengeId(id);
    handleReset();
  };

  const nextChallenge = () => {
    if (!activeChallenge || challenges.length === 0) return;
    const idx = challenges.findIndex((c) => c.id === activeChallenge.id);
    switchChallenge(challenges[(idx + 1) % challenges.length].id);
  };

  const nodeCount = useMemo(() => {
    const nodes = new Set<string>();
    if (activeChallenge) nodes.add(activeChallenge.id);
    memory.forEach((r) => {
      nodes.add(r.conceptId);
      const ch = challenges.find((c) => c.id === r.conceptId);
      ch?.options.forEach((o) => o.prerequisiteGap && o.misconceptionTitle === r.identifiedMisconception && nodes.add(o.prerequisiteGap));
    });
    return nodes.size;
  }, [memory, challenges, activeChallenge]);

  // --------------------------------------------------------------------------
  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#8266F0]" />
        <p className="text-sm font-semibold text-neutral-500">Loading your diagnostic…</p>
      </div>
    );
  }

  if (!activeChallenge) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <AlertTriangle className="w-8 h-8 text-rose-500 mb-3" />
        <h3 className="text-xl font-bold text-[#141414] mb-2">No Diagnostics Found</h3>
        <p className="text-[#6B6B6B] max-w-md">There are no diagnostic challenges available yet.</p>
      </div>
    );
  }

  if (mode === "adhd" || mode === "dyslexic") {
    const View = mode === "adhd" ? ADHDDiagnosticView : DyslexicDiagnosticView;
    return (
      <View
        currentStage={stage}
        equation={activeChallenge.equationOrPrompt}
        options={activeChallenge.options}
        selectedOption={selectedOption}
        onSelectOption={handleSelectOption}
        verificationChallenge={activeChallenge.verification}
        verificationAnswer={verificationAnswer}
        onSelectVerification={handleSelectVerification}
        onAdvanceStage={() => (stage === 1 ? startLesson() : stage === 2 ? startVerification() : setStage((s) => Math.min(s + 1, 4)))}
        onReset={handleReset}
        elapsedSeconds={(elapsedMs / 1000).toFixed(1)}
      />
    );
  }

  const isCode = activeChallenge.equationOrPrompt.includes("\\n");
  const wrongFirst = !!selectedOption && !selectedOption.isCorrect;
  const chosenVerification = activeChallenge.verification.options.find((o) => o.id === verificationAnswer);
  const verifiedCorrect = !!chosenVerification?.isCorrect;
  const matchedResources = resources.filter((r) => r.discipline === activeChallenge.discipline).slice(0, 3);
  const resolvedMisconception = selectedOption?.misconceptionTitle;

  // Code keeps its layout, short expressions read as equations, longer prompts as prose.
  const promptBox = (text: string) => {
    const style = text.includes("\n")
      ? "font-mono text-left text-sm sm:text-base whitespace-pre overflow-x-auto"
      : text.length <= 40
      ? "text-center font-bold text-2xl sm:text-3xl tracking-wide whitespace-pre-wrap"
      : "text-left text-base sm:text-lg font-semibold leading-relaxed";
    return <div className={`rounded-2xl border border-black/5 bg-[#EFEFEE] px-5 py-6 text-[#141414] ${style}`}>{text}</div>;
  };

  const primaryBtn = "h-11 px-6 rounded-full bg-[#8266F0] hover:bg-[#6F52E6] text-white text-sm font-bold flex items-center gap-2 transition";
  const secondaryBtn = "h-11 px-6 rounded-full bg-[#E6E6E4] hover:bg-[#DADAD8] text-[#141414] text-sm font-semibold flex items-center gap-2 transition";

  const renderStage = () => {
    if (stage === 0) {
      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PhaseChip tone="purple" icon={HelpCircle}>
              Diagnostic Phase ({activeChallenge.gradeLevel})
            </PhaseChip>
            <span className="text-xs font-mono text-[#6B6B6B] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {(elapsedMs / 1000).toFixed(1)}s
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#141414]">{activeChallenge.instructions}</h2>
          {promptBox(activeChallenge.equationOrPrompt)}
          <div className="rounded-2xl bg-[#FFF7E6] border border-[#F6DFA5] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-bold text-[#7C5300]">
                <Lightbulb className="w-4 h-4" /> Hints ({hintTier}/3 used)
              </span>
              <button
                onClick={() => setHintTier((h) => Math.min(3, h + 1))}
                disabled={hintTier >= 3}
                className="h-8 px-3 rounded-full bg-[#FDECC0] hover:bg-[#FBE2A0] text-xs font-bold text-[#7C5300] disabled:opacity-40 transition"
              >
                {hintTier >= 3 ? "All hints shown" : `Show hint ${hintTier + 1}`}
              </button>
            </div>
            {hintTier > 0 && (
              <ul className="mt-3 space-y-1.5">
                {activeChallenge.hints.slice(0, hintTier).map((h) => (
                  <li key={h.tier} className="text-sm text-[#3D3522]">
                    <strong>{h.tierName}:</strong> {h.content}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {activeChallenge.options.map((opt) => (
              <AnswerOption
                key={opt.id}
                label={opt.label}
                mono={isCode}
                disabled={submitting}
                state={selectedOption?.id === opt.id && submitting ? "correct" : "idle"}
                onClick={() => handleSelectOption(opt)}
              />
            ))}
          </div>
          {submitting && (
            <p className="text-xs text-[#6B6B6B] flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysing your answer…
            </p>
          )}
        </div>
      );
    }

    if (stage === 1 && selectedOption) {
      return (
        <div className="space-y-5">
          {wrongFirst ? (
            <PhaseChip tone="red" icon={AlertTriangle}>Misconception Detected</PhaseChip>
          ) : (
            <PhaseChip tone="green" icon={CheckCircle2}>Correct: No Misconception Detected</PhaseChip>
          )}
          <div>
            <h2 className="font-display text-2xl font-bold text-[#141414]">
              {wrongFirst ? selectedOption.misconceptionTitle : "Solid reasoning!"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4B4B4B]">
              You chose <strong className="font-mono">{selectedOption.label}</strong>.{" "}
              {wrongFirst ? selectedOption.errorRootCause : selectedOption.explanation}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#FDECEC] p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B91C1C]">Where it goes wrong</span>
              <p className="mt-1 font-mono text-sm font-bold text-[#7F1D1D]">{activeChallenge.microLesson.failurePoint}</p>
            </div>
            <div className="rounded-2xl bg-[#E7F8F0] p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#047857]">Correct path</span>
              <p className="mt-1 font-mono text-sm font-bold text-[#065F46]">{activeChallenge.microLesson.correctPath}</p>
            </div>
          </div>
          {wrongFirst && selectedOption.prerequisiteGap && (
            <p className="rounded-2xl bg-[#FFF7E6] px-4 py-3 text-sm text-[#5C4200]">
              <strong>Prerequisite gap:</strong> {selectedOption.prerequisiteGap}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            {wrongFirst ? (
              <button onClick={startLesson} className={primaryBtn}>
                Start the 60-second reframe <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button onClick={startLesson} className={secondaryBtn}>
                  Review the lesson anyway
                </button>
                <button onClick={startVerification} className={primaryBtn}>
                  Verify in a new context <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    if (stage === 2) {
      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PhaseChip tone="amber" icon={BookOpen}>Micro-Lesson</PhaseChip>
            <button
              onClick={() => speak(activeChallenge.microLesson.voiceScript)}
              className="h-8 px-3 rounded-full bg-[#EDEDEC] hover:bg-[#E2E2E0] text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Volume2 className="w-3.5 h-3.5" /> Read aloud
            </button>
          </div>
          <h2 className="font-display text-2xl font-bold text-[#141414]">{activeChallenge.microLesson.title}</h2>
          <div className="rounded-2xl bg-[#F3F0FF] px-5 py-6 text-center">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-[#5B3FD0]">{activeChallenge.microLesson.ruleName}</div>
            <p className="mt-3 text-sm text-[#4B4B4B] max-w-lg mx-auto">{activeChallenge.microLesson.analogySummary}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#FDECEC] p-4 font-mono text-sm font-bold text-[#7F1D1D]">{activeChallenge.microLesson.failurePoint}</div>
            <div className="rounded-2xl bg-[#E7F8F0] p-4 font-mono text-sm font-bold text-[#065F46]">{activeChallenge.microLesson.correctPath}</div>
          </div>
          {matchedResources.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">Go deeper</p>
              {matchedResources.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-[#E3E3E1] px-4 py-3 text-sm hover:border-[#8266F0] transition"
                >
                  <span className="font-semibold truncate">{r.title}</span>
                  <ExternalLink className="w-4 h-4 text-[#8266F0] shrink-0" />
                </a>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button onClick={startVerification} className={primaryBtn}>
              Test on a fresh question <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    if (stage === 3) {
      return (
        <div className="space-y-5">
          <PhaseChip tone="green" icon={CheckCircle2}>Verification Phase (Different Context, Same Concept)</PhaseChip>
          <h2 className="text-lg font-bold text-[#141414]">Verify your mastery on a new problem with the same structure:</h2>
          {promptBox(activeChallenge.verification.question)}
          <div className="grid gap-3 sm:grid-cols-2">
            {activeChallenge.verification.options.map((opt) => (
              <AnswerOption
                key={opt.id}
                label={opt.label}
                mono={isCode}
                disabled={verifiedCorrect}
                state={verificationAnswer === opt.id ? (opt.isCorrect ? "correct" : "wrong") : "idle"}
                onClick={() => handleSelectVerification(opt.id)}
              />
            ))}
          </div>
          {chosenVerification && (
            <div
              role="status"
              className={`rounded-2xl px-4 py-3 text-sm ${verifiedCorrect ? "bg-[#E7F8F0] text-[#065F46]" : "bg-[#FDECEC] text-[#7F1D1D]"}`}
            >
              {chosenVerification.feedback}
            </div>
          )}
          {chosenVerification && (
            <div className="flex flex-wrap justify-end gap-3 pt-1">
              {verifiedCorrect ? (
                <button onClick={() => setStage(4)} className={primaryBtn}>
                  See updated learner model <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button onClick={() => setStage(2)} className={secondaryBtn}>
                    <BookOpen className="w-4 h-4" /> Review the lesson
                  </button>
                  <button onClick={() => setVerificationAnswer(null)} className={primaryBtn}>
                    <RotateCcw className="w-4 h-4" /> Try again
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    // Stage 4: resolved
    return (
      <div className="py-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#D6F5E6] grid place-items-center text-[#0F9D63]">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="mt-5 font-display text-2xl sm:text-3xl font-bold text-[#141414]">
          {wrongFirst ? "Misconception Successfully Resolved!" : "Concept Mastery Confirmed!"}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#5B5B5B] max-w-md mx-auto">
          {wrongFirst ? (
            <>
              {resolvedMisconception} resolved: {chosenVerification?.label} correctly applied. Learner model updated. The root-cause gap in{" "}
              <strong>{selectedOption?.prerequisiteGap?.toLowerCase() || activeChallenge.topic.toLowerCase()}</strong> has been validated and cleared.
            </>
          ) : (
            <>
              You answered correctly first time and confirmed it in a new context. Learner model updated for{" "}
              <strong>{activeChallenge.topic.toLowerCase()}</strong>.
            </>
          )}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button onClick={nextChallenge} className={primaryBtn}>
            Try Another Problem
          </button>
          <button onClick={() => (window.location.hash = "#pacing")} className={secondaryBtn}>
            View Updated Pacing Track →
          </button>
        </div>
      </div>
    );
  };

  const step = stage === 4 ? "done" : stage + 1;
  const header =
    stage === 4
      ? { title: "Diagnostic Loop Complete: Learner Model Updated", subtitle: "Evidence registered into your knowledge graph" }
      : STEPS[stage];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div role="radiogroup" aria-label="Choose a question" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {challenges.map((ch) => {
          const selected = ch.id === activeChallenge.id;
          return (
            <button
              key={ch.id}
              role="radio"
              aria-checked={selected}
              onClick={() => switchChallenge(ch.id)}
              className={`shrink-0 h-9 px-4 rounded-full text-xs font-semibold transition ${
                selected ? "bg-[#141414] text-white" : "bg-[#EDEDEC] text-[#1F1F1F] hover:bg-[#E2E2E0]"
              }`}
            >
              {ch.topic} · {ch.gradeLevel}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-6 min-w-0">
          <StepCard
            step={step}
            title={header.title}
            subtitle={header.subtitle}
            onReset={handleReset}
            headerExtra={
              <button
                onClick={() => setShowMindMap((v) => !v)}
                aria-pressed={showMindMap}
                className={`h-9 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                  showMindMap ? "bg-[#8266F0] text-white" : "bg-[#EDEDEC] hover:bg-[#E2E2E0] text-[#1F1F1F]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Concept map</span>
              </button>
            }
          >
            {renderStage()}
          </StepCard>
          {showMindMap && <InteractiveMindMap discipline={activeChallenge.discipline} activeConceptName={activeChallenge.topic} />}
        </div>

        <aside className="space-y-5 min-w-0" aria-label="Learner model">
          <LearnerModelPanel model={toView(conceptState)} loading={modelLoading} />
          <MistakeMemoryPanel
            records={memory}
            nodeCount={nodeCount}
            onOpen={(r) => (challenges.some((c) => c.id === r.conceptId) ? switchChallenge(r.conceptId) : (window.location.hash = "#misconceptions"))}
          />
        </aside>
      </div>
    </div>
  );
};

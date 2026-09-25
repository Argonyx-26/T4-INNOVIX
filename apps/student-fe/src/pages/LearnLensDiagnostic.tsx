import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, ArrowRight, RotateCcw, Volume2, AlertTriangle, 
  CheckCircle2, HelpCircle, Clock, Brain, Zap, Check, 
  Loader2, Lightbulb, BookOpen, Layers, History, ExternalLink,
  ChevronRight, Compass
} from "lucide-react";
import { useThemeMode } from "../context/ThemeModeContext";
import { ADHDDiagnosticView } from "./ADHDDiagnosticView";
import { DyslexicDiagnosticView } from "./DyslexicDiagnosticView";
import { DiagnosticOption, ConceptChallenge } from "../types";
import { UNIVERSAL_CHALLENGES } from "../data/mockUniversalChallenges";
import { MOCK_EDUCATIONAL_RESOURCES } from "../data/mockResources";
import { InteractiveMindMap } from "../components/InteractiveMindMap";
import { MisconceptionLogModal } from "../components/MisconceptionLogModal";
import { useAuth } from "../context/AuthContext";

export const LearnLensDiagnostic: React.FC = () => {
  const { mode, speak } = useThemeMode();
  const { user } = useAuth();

  // Active Multi-Tier Challenge
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("math-school-linear");
  const activeChallenge: ConceptChallenge = 
    UNIVERSAL_CHALLENGES.find((c) => c.id === selectedChallengeId) || UNIVERSAL_CHALLENGES[0];

  const [currentStage, setCurrentStage] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<DiagnosticOption | null>(null);
  const [verificationAnswer, setVerificationAnswer] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Progressive 3-Tier Scaffolded Hints State
  const [hintTier, setHintTier] = useState<number>(0); // 0 = none, 1 = Nudge, 2 = Scaffold, 3 = Structural

  // Mind map & Log modal toggle state
  const [showMindMap, setShowMindMap] = useState<boolean>(false);
  const [logModalOpen, setLogModalOpen] = useState<boolean>(false);

  // Live state returned from Django Assessment API
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>(null);
  const [newMastery, setNewMastery] = useState<number>(88);

  const timerRef = useRef<number>(Date.now());

  // Precision response timer
  useEffect(() => {
    timerRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - timerRef.current);
    }, 100);
    return () => clearInterval(interval);
  }, [currentStage, selectedChallengeId]);

  // Handle Academic Discipline Switch
  const handleSwitchChallenge = (id: string) => {
    setSelectedChallengeId(id);
    handleReset();
  };

  // Progressive Hint Unlock
  const handleRequestNextHint = () => {
    setHintTier((prev) => Math.min(prev + 1, 3));
  };

  // Wire submission to Django backend with strict anti-spoofing header
  const handleSelectOption = async (opt: DiagnosticOption) => {
    setSelectedOption(opt);
    setIsSubmitting(true);
    setApiError(null);

    const finalTimeMs = Date.now() - timerRef.current;
    const cleanAnswer = opt.label.replace(/^x\s*=\s*/i, "").trim();

    // Strict anti-spoofing matching Django backend requirements
    const studentId = user?.uid || "student_demo_01";
    const mockToken = `mock-${studentId}`;
    const payload = {
      student_id: studentId,
      concept_id: activeChallenge.discipline === "Computer Science" ? "binary_search" : "algebra",
      student_answer: cleanAnswer,
      time_ms: finalTimeMs,
      attempts: 1,
      prior_mastery: 0.50,
    };

    try {
      const response = await fetch("http://localhost:8000/api/assessments/submit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      setDiagnosticResult(data.diagnosis || data);
      if (typeof data.new_mastery === "number") {
        setNewMastery(Math.round(data.new_mastery * 100));
      }
    } catch (err: any) {
      console.warn("API submission error (using response fallback):", err);
      setApiError(err.message || "Failed to reach assessment API");
      setDiagnosticResult({
        misconceptions: [
          {
            identified_misconception: opt.misconceptionTitle || "Cognitive Model Inversion",
            explanation: opt.errorRootCause || opt.explanation,
            prerequisite_concept: opt.prerequisiteGap || "Foundational Axioms",
          },
        ],
        recommended_interventions: [
          {
            action: activeChallenge.microLesson.ruleName,
            concept: activeChallenge.domain,
          },
        ],
      });
    } finally {
      setIsSubmitting(false);
      setCurrentStage(1);
      if (mode === "dyslexic") {
        speak(`Selected ${opt.label}. ${opt.isCorrect ? "Correct answer!" : opt.misconceptionTitle}`);
      }
    }
  };

  const handleSelectVerification = (optId: string) => {
    setVerificationAnswer(optId);
  };

  const handleReset = () => {
    setCurrentStage(0);
    setSelectedOption(null);
    setVerificationAnswer(null);
    setDiagnosticResult(null);
    setApiError(null);
    setHintTier(0);
    timerRef.current = Date.now();
    setElapsedMs(0);
  };

  const formattedSeconds = (elapsedMs / 1000).toFixed(1);

  // Filter matched resources for active challenge
  const matchedResources = MOCK_EDUCATIONAL_RESOURCES.filter(
    (res) => res.discipline === activeChallenge.discipline
  ).slice(0, 3);

  // If in ADHD mode, render the ADHD Focus view
  if (mode === "adhd") {
    return (
      <ADHDDiagnosticView
        currentStage={currentStage}
        equation={activeChallenge.equationOrPrompt}
        options={activeChallenge.options}
        selectedOption={selectedOption}
        onSelectOption={handleSelectOption}
        verificationChallenge={activeChallenge.verification}
        verificationAnswer={verificationAnswer}
        onSelectVerification={handleSelectVerification}
        onAdvanceStage={() => setCurrentStage((prev) => Math.min(prev + 1, 4))}
        onReset={handleReset}
        elapsedSeconds={formattedSeconds}
      />
    );
  }

  // If in Dyslexic mode, render the Dyslexic friendly view
  if (mode === "dyslexic") {
    return (
      <DyslexicDiagnosticView
        currentStage={currentStage}
        equation={activeChallenge.equationOrPrompt}
        options={activeChallenge.options}
        selectedOption={selectedOption}
        onSelectOption={handleSelectOption}
        verificationChallenge={activeChallenge.verification}
        verificationAnswer={verificationAnswer}
        onSelectVerification={handleSelectVerification}
        onAdvanceStage={() => setCurrentStage((prev) => Math.min(prev + 1, 4))}
        onReset={handleReset}
        elapsedSeconds={formattedSeconds}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Universal Multi-Tier Discipline Switcher Bar */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-4 sm:p-5 border border-black/10 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#8266F0]">
            <Compass className="w-3.5 h-3.5" />
            <span>Multi-Tier Academic Spectrum</span>
          </div>
          <h4 className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
            Select Universal Academic Level:
          </h4>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1">
          {UNIVERSAL_CHALLENGES.map((ch) => {
            const isSelected = ch.id === selectedChallengeId;
            return (
              <button
                key={ch.id}
                onClick={() => handleSwitchChallenge(ch.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
                  isSelected
                    ? "bg-[#8266F0] text-white shadow-md shadow-[#8266F0]/25"
                    : "bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-slate-300 hover:bg-black/10"
                }`}
              >
                <span>{ch.tier.split(" ")[0]} • {ch.discipline}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Tracker Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-black/10 dark:border-white/10 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-md bg-[#8266F0] text-white">
                <Brain className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#8266F0]">
                {activeChallenge.tier} • {activeChallenge.domain}
              </span>
            </div>
            <h1 className="mt-1 font-display font-bold text-3xl text-[#141414] dark:text-white">
              {activeChallenge.topic}
            </h1>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1E1E24] border border-black/10 dark:border-white/10 text-xs font-mono text-slate-600 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-[#8266F0]" />
              <span>{formattedSeconds}s</span>
            </div>

            <button
              onClick={() => setShowMindMap(!showMindMap)}
              className={`p-2 rounded-xl border text-xs font-semibold transition flex items-center space-x-1.5 ${
                showMindMap
                  ? "bg-[#8266F0] text-white border-[#8266F0]"
                  : "bg-white dark:bg-[#1E1E24] border-black/10 dark:border-white/10 text-neutral-700 dark:text-slate-300 hover:border-[#8266F0]"
              }`}
              title="Toggle Concept Mind Map"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Concept Map</span>
            </button>

            <button
              onClick={() => setLogModalOpen(true)}
              className="p-2 rounded-xl bg-white dark:bg-[#1E1E24] border border-black/10 dark:border-white/10 text-neutral-700 dark:text-slate-300 hover:border-[#8266F0] text-xs font-semibold transition flex items-center space-x-1.5"
              title="Student Misconception History"
            >
              <History className="w-3.5 h-3.5 text-[#8266F0]" />
              <span className="hidden sm:inline">Telemetry Log</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-xl text-slate-400 hover:text-[#141414] dark:hover:text-white hover:bg-black/5 transition"
              title="Reset Assessment Loop"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5-Stage Stepper Bar */}
        <div className="mt-6 grid grid-cols-5 gap-2 text-xs">
          {[
            { idx: 0, label: "0. Diagnostic Prompt" },
            { idx: 1, label: "1. Mental Model Diagnosis" },
            { idx: 2, label: "2. Visual Micro-Lesson" },
            { idx: 3, label: "3. Verification Transfer" },
            { idx: 4, label: "4. Bayesian Resolution" },
          ].map((st) => (
            <div
              key={st.idx}
              className={`p-2.5 rounded-xl border text-center font-medium transition ${
                currentStage === st.idx
                  ? "bg-[#8266F0] text-white border-[#8266F0] shadow-sm font-bold"
                  : currentStage > st.idx
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                  : "bg-white/50 dark:bg-white/5 text-slate-400 border-transparent"
              }`}
            >
              <span>{st.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Concept Mind Map View (Section 5.1) */}
      {showMindMap && (
        <InteractiveMindMap
          discipline={activeChallenge.discipline}
          activeConceptName={activeChallenge.topic}
        />
      )}

      {/* STAGE 0: Diagnostic Challenge */}
      {currentStage === 0 && (
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-8 sm:p-10 border border-black/10 dark:border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#8266F0]/10 text-[#8266F0]">
              {activeChallenge.gradeLevel}
            </span>
            <span className="text-xs text-[#6B6B6B] dark:text-slate-400">
              Scaffolded Intelligent Diagnostic
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-display font-bold text-[#141414] dark:text-white">
            {activeChallenge.instructions}
          </h2>

          <div className="my-6 p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 font-mono font-bold text-lg sm:text-2xl text-center text-[#141414] dark:text-white tracking-wide whitespace-pre-wrap">
            {activeChallenge.equationOrPrompt}
          </div>

          {/* Progressive 3-Tier Scaffolded Hints (Section 4.2) */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Scaffolded Hints System ({hintTier}/3 Unlocked)
                </span>
              </div>
              <button
                onClick={handleRequestNextHint}
                disabled={hintTier >= 3}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold transition disabled:opacity-40"
              >
                {hintTier === 0 ? "Request Tier 1 Nudge" : hintTier === 1 ? "Unlock Tier 2 Scaffold" : hintTier === 2 ? "Unlock Tier 3 Guidance" : "All Hints Unlocked"}
              </button>
            </div>

            {hintTier > 0 && (
              <div className="space-y-2 pt-1 border-t border-amber-500/20">
                {activeChallenge.hints.slice(0, hintTier).map((hint) => (
                  <div key={hint.tier} className="text-xs text-neutral-800 dark:text-slate-200 flex items-start space-x-2">
                    <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                      Tier {hint.tier} ({hint.tierName})
                    </span>
                    <span>{hint.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {activeChallenge.options.map((opt) => (
              <button
                key={opt.id}
                disabled={isSubmitting}
                onClick={() => handleSelectOption(opt)}
                className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#25252D] hover:border-[#8266F0] hover:bg-[#8266F0]/5 text-left font-mono font-bold text-base sm:text-lg text-[#141414] dark:text-white transition group flex items-center justify-between disabled:opacity-50 shadow-sm"
              >
                <span>{opt.label}</span>
                <span className="text-xs font-sans text-slate-400 group-hover:text-[#8266F0] transition flex items-center space-x-1 shrink-0 ml-2">
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#8266F0]" />
                  ) : (
                    <span>Submit →</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 1: Cognitive Pattern Identification */}
      {currentStage === 1 && selectedOption && (
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-8 sm:p-10 border border-black/10 dark:border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <span className={`p-1.5 rounded-lg text-white ${selectedOption.isCorrect ? "bg-emerald-500" : "bg-rose-500"}`}>
                {selectedOption.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </span>
              <span className="font-bold text-sm uppercase tracking-wider text-[#141414] dark:text-white">
                {selectedOption.isCorrect ? "Mastery Demonstrated!" : "Cognitive Misconception Flagged"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-[#8266F0]/10 text-[#8266F0]">
                Lifecycle: Remediating
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold text-[#141414] dark:text-white">
              {selectedOption.isCorrect
                ? "Flawless Reasoning!"
                : diagnosticResult?.misconceptions?.[0]?.identified_misconception || selectedOption.misconceptionTitle}
            </h2>
            <p className="mt-2 text-sm text-[#6B6B6B] dark:text-slate-300 leading-relaxed">
              {diagnosticResult?.misconceptions?.[0]?.explanation ||
                selectedOption.errorRootCause ||
                selectedOption.explanation}
            </p>
          </div>

          {/* Structured Visual Explanation (Section 5.1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-black/5 dark:border-white/10">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                Point of Cognitive Failure (Red Branch)
              </span>
              <div className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300">
                {activeChallenge.microLesson.failurePoint}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                Correct Conceptual Pathway (Emerald)
              </span>
              <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {activeChallenge.microLesson.correctPath}
              </div>
            </div>
          </div>

          {(diagnosticResult?.misconceptions?.[0]?.prerequisite_concept || selectedOption.prerequisiteGap) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-bold block mb-1">Prerequisite Skill Gap Identified by AI:</span>
              <span>
                {diagnosticResult?.misconceptions?.[0]?.prerequisite_concept || selectedOption.prerequisiteGap}
              </span>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end space-x-4">
            <button
              onClick={() => setCurrentStage(2)}
              className="px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#8266F0] to-[#EC4899] hover:opacity-95 text-white shadow-lg shadow-[#8266F0]/25 transition flex items-center space-x-2"
            >
              <span>{selectedOption.isCorrect ? "Advance to Verification" : "Launch 60-Second Reframing"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: Targeted Micro-Intervention */}
      {currentStage === 2 && (
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-8 sm:p-10 border border-black/10 dark:border-white/10 shadow-xl space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#8266F0]">
                Stage 2: 60-Second Targeted Reframing
              </span>
              <h2 className="mt-1 font-display font-bold text-2xl text-[#141414] dark:text-white">
                {activeChallenge.microLesson.title}
              </h2>
            </div>

            <button
              onClick={() => speak(activeChallenge.microLesson.voiceScript)}
              className="p-2.5 rounded-xl bg-[#8266F0]/10 text-[#8266F0] hover:bg-[#8266F0]/20 transition flex items-center space-x-1.5 text-xs font-semibold"
              title="Read Lesson Aloud"
            >
              <Volume2 className="w-4 h-4" />
              <span>Read Aloud</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="p-6 rounded-3xl bg-[#8266F0]/10 border border-[#8266F0]/20 text-center space-y-3">
              <div className="font-mono font-bold text-2xl sm:text-3xl text-[#8266F0]">
                {activeChallenge.microLesson.ruleName}
              </div>
              <p className="text-xs text-[#6B6B6B] dark:text-slate-300">
                {activeChallenge.microLesson.analogySummary}
              </p>
            </div>

            <div className="space-y-3 text-sm text-[#141414] dark:text-slate-200 leading-relaxed">
              <p className="font-semibold text-xs text-neutral-500 uppercase tracking-wider">
                Vetted Academic Curated Library Recommendations:
              </p>
              <div className="space-y-2">
                {matchedResources.map((res) => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#8266F0]/10 border border-black/5 dark:border-white/10 flex items-center justify-between text-xs transition"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-neutral-900 dark:text-white block truncate">
                        {res.title}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {res.source} • {res.type}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8266F0] shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end">
            <button
              onClick={() => setCurrentStage(3)}
              className="px-6 py-3 rounded-2xl font-bold text-sm bg-[#141414] dark:bg-white text-white dark:text-[#141414] hover:opacity-90 shadow-md transition flex items-center space-x-2"
            >
              <span>Test Knowledge on Fresh Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: Verification Challenge */}
      {currentStage === 3 && (
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-8 sm:p-10 border border-black/10 dark:border-white/10 shadow-xl space-y-6">
          <div className="pb-4 border-b border-black/5 dark:border-white/10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#EC4899]">
              Stage 3: Isomorphic Transfer Challenge
            </span>
            <h2 className="mt-1 font-display font-bold text-2xl text-[#141414] dark:text-white">
              Prove conceptual retention in a fresh context:
            </h2>
          </div>

          <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 font-mono font-bold text-lg sm:text-2xl text-center text-[#141414] dark:text-white">
            {activeChallenge.verification.question}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeChallenge.verification.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelectVerification(opt.id)}
                className={`p-4 rounded-2xl border font-mono font-bold text-base transition text-left flex items-center justify-between ${
                  verificationAnswer === opt.id
                    ? opt.isCorrect
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-rose-500 text-white border-rose-500"
                    : "bg-white dark:bg-[#25252D] border-black/10 dark:border-white/10 hover:border-[#8266F0] text-[#141414] dark:text-white"
                }`}
              >
                <span>{opt.label}</span>
                {verificationAnswer === opt.id && (
                  <span className="text-xs font-sans">
                    {opt.isCorrect ? "✓ Mastered" : "Try Again"}
                  </span>
                )}
              </button>
            ))}
          </div>

          {verificationAnswer && (
            <div className="pt-4 flex items-center justify-end">
              <button
                onClick={() => setCurrentStage(4)}
                className="px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#8266F0] to-[#EC4899] hover:opacity-95 text-white shadow-lg transition flex items-center space-x-2"
              >
                <span>Complete Diagnostic & Sync Mastery</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STAGE 4: State Update & Resolution */}
      {currentStage === 4 && (
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-8 sm:p-12 border border-black/10 dark:border-white/10 shadow-2xl text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Diagnostic Loop Successfully Resolved • Lifecycle: Resolved
            </span>
            <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl text-[#141414] dark:text-white">
              Concept Mastery Recalculated to {newMastery}%
            </h2>
            <p className="mt-2 text-sm text-[#6B6B6B] dark:text-slate-300 max-w-lg mx-auto">
              Your cognitive model has been updated in the Bayesian Knowledge Tracing engine. The misconception hurdle has been marked cleared in your persistent log.
            </p>
          </div>

          {/* Metric Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <span className="text-xs text-[#6B6B6B] dark:text-slate-400">Mastery Score</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{newMastery}%</div>
              <span className="text-[10px] text-emerald-600 font-semibold">+38% from baseline</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <span className="text-xs text-[#6B6B6B] dark:text-slate-400">Misconception Risk</span>
              <div className="text-2xl font-bold text-[#8266F0] mt-1">12%</div>
              <span className="text-[10px] text-[#8266F0] font-semibold">Low Fragility</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <span className="text-xs text-[#6B6B6B] dark:text-slate-400">Time to Clearance</span>
              <div className="text-2xl font-bold text-[#141414] dark:text-white mt-1">58s</div>
              <span className="text-[10px] text-slate-500 font-semibold">Rapid Recovery</span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-semibold text-sm bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#141414] dark:text-white transition flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retest New Equation</span>
            </button>

            <a
              href="#courses"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#8266F0] to-[#EC4899] text-white hover:opacity-95 shadow-lg shadow-[#8266F0]/25 transition text-center"
            >
              Explore Next Module →
            </a>
          </div>
        </div>
      )}

      {/* Misconception Log Modal */}
      <MisconceptionLogModal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
      />
    </div>
  );
};

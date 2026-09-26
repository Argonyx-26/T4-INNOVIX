import React from "react";
import { Check, RotateCcw, TrendingUp, AlertCircle } from "lucide-react";
import { StudentMisconceptionRecord } from "../../types";

// ---------------------------------------------------------------------------
// Step card: the white main panel with a numbered header and a restart action.
// ---------------------------------------------------------------------------
interface StepCardProps {
  step: number | "done";
  title: string;
  subtitle: string;
  onReset: () => void;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}

export const StepCard: React.FC<StepCardProps> = ({ step, title, subtitle, onReset, headerExtra, children }) => (
  <section aria-labelledby="step-title" className="rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
    <div className="flex items-start justify-between gap-4 pb-5 border-b border-black/10">
      <div className="flex items-start gap-3 min-w-0">
        <span
          aria-hidden="true"
          className="w-9 h-9 shrink-0 rounded-full bg-fill-2 grid place-items-center text-xs font-bold text-[#1F1F1F]"
        >
          {step === "done" ? <Check className="w-4 h-4" strokeWidth={3} /> : String(step).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h1 id="step-title" className="font-display font-bold text-[15px] sm:text-base text-[#141414] leading-snug">
            {title}
          </h1>
          <p className="text-xs text-[#6B6B6B]">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {headerExtra}
        <button
          onClick={onReset}
          className="h-9 px-3.5 rounded-full bg-fill-2 hover:bg-fill-hover text-xs font-semibold text-[#1F1F1F] flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>
      </div>
    </div>
    <div className="pt-6">{children}</div>
  </section>
);

// ---------------------------------------------------------------------------
// Coloured phase chip (e.g. "Verification Phase").
// ---------------------------------------------------------------------------
const CHIP_TONES = {
  green: "bg-[#C9F0DC] text-[#0F6B45]",
  red: "bg-[#FAD4D4] text-[#8F1D1D]",
  purple: "bg-brand-soft text-brand-ink",
  amber: "bg-[#FDECC0] text-[#7C5300]",
};

export const PhaseChip: React.FC<{ tone: keyof typeof CHIP_TONES; icon: React.ElementType; children: React.ReactNode }> = ({
  tone,
  icon: Icon,
  children,
}) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${CHIP_TONES[tone]}`}>
    <Icon className="w-3.5 h-3.5" />
    {children}
  </span>
);

// ---------------------------------------------------------------------------
// Answer option button (2-column grid in the templates).
// ---------------------------------------------------------------------------
interface AnswerOptionProps {
  label: string;
  state?: "idle" | "selected" | "correct" | "wrong";
  disabled?: boolean;
  mono?: boolean;
  onClick: () => void;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({ label, state = "idle", disabled, mono, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-pressed={state !== "idle"}
    className={`w-full min-h-[52px] rounded-2xl border px-4 py-3 text-left text-[15px] font-bold transition disabled:cursor-not-allowed ${
      mono ? "font-mono" : ""
    } ${
      state === "correct"
        ? "border-[#10B981] bg-[#E7F8F0] text-[#065F46]"
        : state === "wrong"
        ? "border-[#EF4444] bg-[#FDECEC] text-[#8F1D1D]"
        : state === "selected"
        ? "border-brand bg-brand-faint text-[#2A1B6B] ring-2 ring-brand/30"
        : "border-[#E3E3E1] bg-white text-[#1F1F1F] hover:border-brand hover:bg-brand-faint disabled:opacity-60"
    }`}
  >
    {label}
  </button>
);

// ---------------------------------------------------------------------------
// Dynamic learner model panel.
// ---------------------------------------------------------------------------
export interface LearnerModelView {
  mastery: number;
  risk: number;
  confidence: number;
  retention: number;
  lastEvent: string;
}

const pct = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 100);

export const LearnerModelPanel: React.FC<{ model: LearnerModelView | null; loading?: boolean }> = ({ model, loading }) => {
  const riskHigh = (model?.risk ?? 0) >= 0.5;
  const rows = model
    ? [
        { label: "Concept Mastery", value: model.mastery, color: "#8266F0" },
        { label: "Misconception Risk", value: model.risk, color: riskHigh ? "#EF4444" : "#10B981" },
        { label: "Confidence Score", value: model.confidence, color: "#F59E0B" },
        { label: "Retention Persistence", value: model.retention, color: "#10B981" },
      ]
    : [];
  return (
    <section aria-labelledby="learner-model-title" className="rounded-[28px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between pb-3 border-b border-black/10">
        <h2 id="learner-model-title" className="font-sans flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#141414]">
          <TrendingUp className="w-4 h-4 text-brand" />
          Dynamic Learner Model
        </h2>
        <span className="w-2 h-2 rounded-full bg-[#22C55E]" title="Live" aria-label="Live" />
      </div>
      <div className="py-4 space-y-3.5" aria-live="polite">
        {loading || !model ? (
          <p className="text-xs text-[#6B6B6B]">Loading your learner model…</p>
        ) : (
          rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-xs font-semibold text-[#1F1F1F]">
                <span>{r.label}</span>
                <span style={{ color: r.color }}>{pct(r.value)}%</span>
              </div>
              <div
                className="mt-1.5 h-2.5 rounded-full bg-[#E5E5E4] overflow-hidden"
                role="progressbar"
                aria-label={r.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct(r.value)}
              >
                <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct(r.value)}%`, backgroundColor: r.color }} />
              </div>
            </div>
          ))
        )}
      </div>
      <p className="pt-3 border-t border-black/10 text-[11px] text-[#6B6B6B]">
        Last Event: <strong className="text-[#141414]">{model?.lastEvent || "—"}</strong>
      </p>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Learner mistake memory (30-day window).
// ---------------------------------------------------------------------------
// Stored as UTC "YYYY-MM-DD HH:MM" (from toISOString) without a zone marker.
const parseDate = (s?: string) => (s ? new Date(s.includes("T") ? s : `${s.replace(" ", "T")}Z`) : null);
const daysAgo = (d: Date | null) => (d ? Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000)) : null);
const agoText = (n: number | null) => (n === null ? "" : n === 0 ? "today" : n === 1 ? "1 day ago" : `${n} days ago`);

export const withinWindow = (records: StudentMisconceptionRecord[], days = 30) =>
  records.filter((r) => {
    const d = daysAgo(parseDate(r.lastAttempt) || parseDate(r.firstDetected));
    return d === null || d <= days;
  });

export const MistakeMemoryPanel: React.FC<{
  records: StudentMisconceptionRecord[];
  nodeCount: number;
  onOpen: (record: StudentMisconceptionRecord) => void;
}> = ({ records, nodeCount, onOpen }) => {
  const recent = withinWindow(records)
    .slice()
    .sort((a, b) => (parseDate(b.lastAttempt)?.getTime() ?? 0) - (parseDate(a.lastAttempt)?.getTime() ?? 0));
  return (
    <section aria-labelledby="memory-title" className="rounded-[28px] bg-fill-2 p-4">
      <h2 id="memory-title" className="font-sans flex items-center gap-2 px-1 pb-3 text-xs font-bold text-[#141414]">
        <AlertCircle className="w-4 h-4" />
        Learner Mistake Memory (30-Day Window)
      </h2>
      <div className="space-y-2.5">
        {recent.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-3 text-xs text-[#6B6B6B]">No mistakes recorded in the last 30 days.</p>
        ) : (
          recent.slice(0, 4).map((r) => {
            const resolved = r.status === "Resolved";
            const tracked = r.status === "Detected";
            return (
              <button
                key={r.id}
                onClick={() => onOpen(r)}
                className="w-full rounded-2xl bg-white px-4 py-3 flex items-center justify-between gap-3 text-left hover:shadow-md transition"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-[#141414] truncate">{r.identifiedMisconception || r.conceptName}</span>
                  <span className="block text-[11px] text-[#6B6B6B] truncate">
                    {resolved
                      ? `Resolved ${agoText(daysAgo(parseDate(r.resolutionTimestamp) || parseDate(r.lastAttempt)))}`
                      : `${r.attemptCount} occurrence${r.attemptCount === 1 ? "" : "s"} · ${r.conceptName}`}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    resolved ? "bg-[#BDEBD4] text-[#065F46]" : tracked ? "bg-[#F4CACA] text-[#7F1D1D]" : "bg-[#FDE7B0] text-[#7C5300]"
                  }`}
                >
                  {resolved ? "Mastered" : tracked ? "Tracked" : "In progress"}
                </span>
              </button>
            );
          })
        )}
      </div>
      <p className="pt-3 text-center text-[11px] text-[#6B6B6B]">
        Knowledge graph connections: <strong className="text-[#141414]">{nodeCount} active node{nodeCount === 1 ? "" : "s"}</strong>
      </p>
    </section>
  );
};

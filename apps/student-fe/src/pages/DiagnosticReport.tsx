import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ThumbsUp,
  ArrowDownRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { dataService, AiMisconceptionRecord } from "../services/dataService";
import {
  learningService,
  buildReport,
  recommendTopics,
  Recommendation,
  TopicMasteryMap,
  RESOLVE_STREAK,
  slugKey,
} from "../services/learningService";
import { StudentMisconceptionRecord } from "../types";
import { PENDING_PRACTICE_KEY } from "./AITutor";
import { PENDING_CHALLENGE_KEY } from "./LearnLensDiagnostic";

interface DiagnosticReportProps {
  onNavigate: (hash: string) => void;
}

const card = "rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]";
const INK = "#141414";
const MUTED = "#6B6B6B";
const SERIES = "#8266F0";
const GRID = "#EDEDEC";

const pct = (v: number) => `${Math.round(v * 100)}%`;
const shortDate = (d: string) => new Date(`${d}T00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

// --------------------------------------------------------------------------
// Overall mastery over time: one series, so the title names it and no legend.
// --------------------------------------------------------------------------
const ProgressChart: React.FC<{ points: { date: string; mastery: number }[] }> = ({ points }) => {
  const [hover, setHover] = useState<number | null>(null);
  // Wide coordinate space so 11px labels stay ~11px when the card is ~1000px wide.
  const W = 1000;
  const H = 260;
  const pad = { l: 44, r: 20, t: 16, b: 34 };
  const x = (i: number) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (points.length - 1));
  const y = (v: number) => pad.t + (1 - v) * (H - pad.t - pad.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.mastery)}`).join(" ");
  const labelIdx = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]));
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Overall mastery from ${pct(first.mastery)} on ${shortDate(first.date)} to ${pct(last.mastery)} on ${shortDate(last.date)}`}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth={1} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill={MUTED}>
              {v * 100}%
            </text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill={MUTED}>
            {shortDate(points[i].date)}
          </text>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="#C9C9C6" strokeWidth={1} strokeDasharray="3 3" />}
        <path d={path} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={p.date}>
            <circle cx={x(i)} cy={y(p.mastery)} r={4} fill="#fff" stroke={SERIES} strokeWidth={2} />
            <circle
              cx={x(i)}
              cy={y(p.mastery)}
              r={14}
              fill="transparent"
              tabIndex={0}
              aria-label={`${shortDate(p.date)}: ${pct(p.mastery)}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              style={{ outline: "none" }}
            />
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl bg-[#141414] px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(points[hover].mastery) / H) * 100}%`, marginTop: -10 }}
        >
          <div className="font-semibold">{shortDate(points[hover].date)}</div>
          <div>Overall mastery {pct(points[hover].mastery)}</div>
        </div>
      )}
    </div>
  );
};

export const DiagnosticReport: React.FC<DiagnosticReportProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<StudentMisconceptionRecord[]>([]);
  const [mastery, setMastery] = useState<TopicMasteryMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([dataService.getStudentMisconceptions(user.uid), learningService.getTopicMastery(user.uid)])
      .then(([recs, m]) => {
        setRecords(recs);
        setMastery(m);
      })
      .catch((err) => {
        console.warn("[Report] Could not load profile:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const report = useMemo(() => buildReport(mastery, records), [mastery, records]);
  const recommendations = useMemo(() => recommendTopics(mastery, records, user?.academicTier, 4), [mastery, records, user?.academicTier]);

  const startRecommendation = (r: Recommendation) => {
    try {
      sessionStorage.setItem(PENDING_PRACTICE_KEY, JSON.stringify({ subject: r.subject, topic: r.topic, focus: r.focus }));
    } catch {
      /* storage unavailable */
    }
    onNavigate("#ai-tutor");
  };

  const practiseMisconception = (r: StudentMisconceptionRecord) => {
    const ai = r as Partial<AiMisconceptionRecord>;
    try {
      if (r.conceptId.startsWith("ai:")) {
        sessionStorage.setItem(
          PENDING_PRACTICE_KEY,
          JSON.stringify({
            subject: r.discipline,
            topic: r.conceptName,
            focus: { recordId: r.id, ref: { key: ai.misconceptionKey || slugKey(r.identifiedMisconception), title: r.identifiedMisconception, explanation: ai.explanation || "" } },
          })
        );
        onNavigate("#ai-tutor");
      } else {
        sessionStorage.setItem(PENDING_CHALLENGE_KEY, r.conceptId);
        onNavigate("#diagnostic");
      }
    } catch {
      onNavigate("#misconceptions");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-sm font-semibold text-neutral-500">
        <Loader2 className="w-5 h-5 animate-spin text-brand" /> Building your cognitive report…
      </div>
    );
  }

  const noData = report.topics.length === 0 && records.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-[#141414]">Cognitive Diagnostic Report</h1>
          <p className="adhd-hide text-sm text-[#6B6B6B]">Updated continuously from your diagnostics, practice and tests.</p>
        </div>
        <button onClick={() => onNavigate("#ai-tutor")} className="h-11 px-5 rounded-full bg-brand hover:bg-brand-strong text-white text-sm font-bold flex items-center gap-2 transition">
          Continue learning <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#7F1D1D]">
          We couldn't load your full profile. Some sections may be empty.
        </p>
      )}

      {noData ? (
        <section className={`${card} text-center py-12`}>
          <Sparkles className="w-8 h-8 mx-auto text-brand" />
          <h2 className="mt-3 font-display text-xl font-bold text-[#141414]">Your report fills in as you learn</h2>
          <p className="adhd-clamp mt-1 text-sm text-[#6B6B6B] max-w-md mx-auto">
            Answer a few practice problems or take a quick test and you'll see your strong and weak concepts, misconceptions and progress here.
          </p>
          <button onClick={() => onNavigate("#ai-tutor")} className="mt-5 h-11 px-6 rounded-full bg-[#141414] text-white text-sm font-bold">
            Start practising
          </button>
        </section>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Overall mastery", value: report.overallMastery === null ? "–" : pct(report.overallMastery), icon: TrendingUp },
              { label: "Topics practised", value: String(report.topics.length), icon: Sparkles },
              { label: "Active misconceptions", value: String(report.active.length), icon: Target },
              { label: "Resolved misconceptions", value: String(report.resolved.length), icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.label} className="rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6B6B6B]">
                  <s.icon className="w-4 h-4" /> {s.label}
                </div>
                <div className="mt-1 text-3xl font-extrabold text-[#141414]">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Progress over time */}
            <section className={`${card} lg:col-span-2`} aria-labelledby="progress-title">
              <h2 id="progress-title" className="font-display text-lg font-bold text-[#141414]">Overall mastery over time</h2>
              <p className="adhd-hide text-xs text-[#6B6B6B]">Average of your latest mastery in each topic, day by day.</p>
              <div className="mt-4">
                {report.progress.length >= 1 ? (
                  <>
                    <ProgressChart points={report.progress} />
                    <details className="mt-3 text-xs text-[#6B6B6B]">
                      <summary className="cursor-pointer font-semibold">Show as table</summary>
                      <table className="mt-2 w-full max-w-sm text-left">
                        <thead>
                          <tr><th className="py-1 font-semibold">Date</th><th className="py-1 font-semibold">Overall mastery</th></tr>
                        </thead>
                        <tbody>
                          {report.progress.map((p) => (
                            <tr key={p.date} className="border-t border-black/5"><td className="py-1">{shortDate(p.date)}</td><td className="py-1">{pct(p.mastery)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  </>
                ) : (
                  <p className="text-sm text-[#6B6B6B]">Progress appears after your first practised topic.</p>
                )}
              </div>
            </section>

            {/* Concept mastery */}
            <section className={card} aria-labelledby="mastery-title">
              <h2 id="mastery-title" className="font-display text-lg font-bold text-[#141414]">Concept mastery</h2>
              <ul className="mt-4 space-y-3">
                {report.topics.map((t) => {
                  const strong = t.mastery >= 0.75 && t.attempts >= 2;
                  const weak = t.mastery < 0.5;
                  return (
                    <li key={t.topicId}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0">
                          <span className="font-semibold text-[#141414]">{t.topic}</span>
                          <span className="ml-2 text-xs text-[#6B6B6B]">{t.subject}</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          {strong && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-[#0F6B45]"><ThumbsUp className="w-3 h-3" /> Strong</span>
                          )}
                          {weak && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-[#8F1D1D]"><ArrowDownRight className="w-3 h-3" /> Needs work</span>
                          )}
                          <span className="font-bold" style={{ color: INK }}>{pct(t.mastery)}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 rounded-full bg-fill-2" role="progressbar" aria-label={`${t.topic} mastery`} aria-valuenow={Math.round(t.mastery * 100)} aria-valuemin={0} aria-valuemax={100}>
                        <div className="h-full rounded-[4px]" style={{ width: pct(t.mastery), backgroundColor: SERIES }} />
                      </div>
                      <div className="mt-1 text-[11px] text-[#6B6B6B]">{t.correct}/{t.attempts} correct</div>
                    </li>
                  );
                })}
                {report.topics.length === 0 && <li className="text-sm text-[#6B6B6B]">No topics practised yet.</li>}
              </ul>
            </section>

            {/* Recommended */}
            <section className={card} aria-labelledby="recommend-title">
              <h2 id="recommend-title" className="font-display text-lg font-bold text-[#141414]">Recommended areas for improvement</h2>
              <ul className="mt-4 space-y-2.5">
                {recommendations.map((r) => (
                  <li key={r.topicId}>
                    <button onClick={() => startRecommendation(r)} className="w-full rounded-2xl border border-[#E3E3E1] p-4 text-left hover:border-brand hover:bg-brand-faint transition">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#141414]">{r.topic}</span>
                        <ArrowRight className="w-4 h-4 text-brand" />
                      </span>
                      <span className="block text-xs text-[#6B6B6B]">{r.subject} · {r.reason}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {(report.strong.length > 0 || report.weak.length > 0) && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F6B45]">Strong concepts</h3>
                    <p className="mt-1 text-[#141414]">{report.strong.map((t) => t.topic).join(", ") || "None yet"}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#8F1D1D]">Weak concepts</h3>
                    <p className="mt-1 text-[#141414]">{report.weak.map((t) => t.topic).join(", ") || "None"}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Active misconceptions */}
            <section className={card} aria-labelledby="active-title">
              <h2 id="active-title" className="flex items-center gap-2 font-display text-lg font-bold text-[#141414]">
                <AlertTriangle className="w-4 h-4 text-[#B45309]" /> Active misconceptions
              </h2>
              <ul className="mt-4 space-y-2.5">
                {report.active.map((r) => {
                  const streak = (r as Partial<AiMisconceptionRecord>).practiceStreak || 0;
                  return (
                    <li key={r.id} className="rounded-2xl bg-[#FFF7E6] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-[#141414]">{r.identifiedMisconception}</div>
                          <div className="text-xs text-[#6B6B6B]">
                            {r.conceptName} · {r.status} · seen {r.attemptCount}×{streak > 0 ? ` · ${streak}/${RESOLVE_STREAK} toward resolved` : ""}
                          </div>
                        </div>
                        <button onClick={() => practiseMisconception(r)} className="shrink-0 h-9 px-3.5 rounded-full bg-[#141414] text-white text-xs font-bold">
                          Practise
                        </button>
                      </div>
                    </li>
                  );
                })}
                {report.active.length === 0 && <li className="text-sm text-[#6B6B6B]">No active misconceptions. Nice work!</li>}
              </ul>
            </section>

            {/* Resolved */}
            <section className={card} aria-labelledby="resolved-title">
              <h2 id="resolved-title" className="flex items-center gap-2 font-display text-lg font-bold text-[#141414]">
                <CheckCircle2 className="w-4 h-4 text-[#0F6B45]" /> Resolved misconceptions
              </h2>
              <ul className="mt-4 space-y-2.5">
                {report.resolved.map((r) => (
                  <li key={r.id} className="rounded-2xl bg-[#E7F8F0] p-4">
                    <div className="font-bold text-[#141414]">{r.identifiedMisconception}</div>
                    <div className="text-xs text-[#6B6B6B]">
                      {r.conceptName} · resolved {r.resolutionTimestamp ? new Date(r.resolutionTimestamp).toLocaleDateString() : ""}
                    </div>
                  </li>
                ))}
                {report.resolved.length === 0 && <li className="text-sm text-[#6B6B6B]">Resolve a misconception with targeted practice and it will show here.</li>}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

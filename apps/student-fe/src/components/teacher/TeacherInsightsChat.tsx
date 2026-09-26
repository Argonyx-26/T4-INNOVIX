import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Loader2, Users, Search, RefreshCw, AlertTriangle, Flag, GitCompare, FileText, UserRound, Trash2, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { dataService } from "../../services/dataService";
import { mentorService } from "../../services/mentorService";
import {
  askInsights,
  buildDossier,
  compactDossier,
  decideScope,
  findMentioned,
  RosterEntry,
  Scope,
  StudentDossier,
  summariseClass,
  ClassSummary,
} from "../../services/teacherInsightsService";
import { TutorError } from "../../services/tutorService";
import { SimpleMarkdown } from "../SimpleMarkdown";

type Cards =
  | { kind: "student"; dossier: StudentDossier }
  | { kind: "compare"; dossiers: StudentDossier[] }
  | { kind: "class"; summary: ClassSummary; students: StudentDossier[] };

interface Message {
  role: "user" | "assistant";
  text: string;
  cards?: Cards;
  sources?: string;
  provider?: string;
  error?: string;
  pending?: boolean;
}

const MAX_SELECTED = 4;
const panel = "rounded-[28px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]";
const val = (v: number | null, suffix = "%") => (v === null ? "–" : `${v}${suffix}`);

const SampleChip = () => (
  <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">Sample</span>
);

// ---------------------------------------------------------------------------
// Data cards (computed locally; shown even when the AI is unavailable)
// ---------------------------------------------------------------------------
const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl bg-neutral-50 px-3 py-2">
    <div className="text-[10px] font-semibold text-neutral-500">{label}</div>
    <div className="text-base font-extrabold text-[#1F2230]">{value}</div>
  </div>
);

const StudentCard: React.FC<{ d: StudentDossier }> = ({ d }) => (
  <div className="rounded-2xl border border-black/5 p-4 space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <UserRound className="w-4 h-4 text-brand" />
      <span className="font-bold text-[#1F2230]">{d.name}</span>
      {d.sample && <SampleChip />}
      <span className="text-xs text-neutral-500">{[d.level, d.lastActive && `last active ${d.lastActive}`].filter(Boolean).join(" · ")}</span>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Metric label="Overall mastery" value={val(d.overallMastery)} />
      <Metric label="Avg test score" value={val(d.tests.averageScore)} />
      <Metric label="Active misconceptions" value={String(d.activeMisconceptions.length)} />
      <Metric label="Resolved" value={String(d.resolvedMisconceptions.length)} />
    </div>
    {d.masteryTrend && (
      <p className="text-xs text-neutral-600">
        Mastery trend: {d.masteryTrend.from}% <ArrowRight className="inline w-3 h-3 mx-0.5" aria-label="to" /> {d.masteryTrend.to}% since {d.masteryTrend.since}
      </p>
    )}
    {(d.weakTopics.length > 0 || d.strongTopics.length > 0) && (
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        <div><span className="font-bold text-rose-600">Weak:</span> <span className="text-neutral-700">{d.weakTopics.join(", ") || "none"}</span></div>
        <div><span className="font-bold text-emerald-600">Strong:</span> <span className="text-neutral-700">{d.strongTopics.join(", ") || "none yet"}</span></div>
      </div>
    )}
    {d.activeMisconceptions.length > 0 && (
      <ul className="space-y-1 text-xs">
        {d.activeMisconceptions.slice(0, 4).map((m, i) => (
          <li key={i} className="flex items-start gap-1.5 text-neutral-700">
            {m.flaggedForTeacher ? <Flag className="w-3 h-3 mt-0.5 text-rose-500 shrink-0" aria-label="Repeated" /> : <span className="w-3 shrink-0">•</span>}
            <span><strong>{m.title}</strong> · {m.topic} · {m.occurrences}× · {m.status}</span>
          </li>
        ))}
      </ul>
    )}
    {d.sampleProfile && (
      <p className="text-xs text-neutral-500">
        {d.sampleProfile.learningStyle} learner · {d.sampleProfile.trajectory} · hint reliance {d.sampleProfile.hintReliance}% · attendance {d.sampleProfile.attendance}%
      </p>
    )}
  </div>
);

const CompareTable: React.FC<{ ds: StudentDossier[] }> = ({ ds }) => {
  const rows: [string, (d: StudentDossier) => string][] = [
    ["Overall mastery", (d) => val(d.overallMastery)],
    ["Avg test score", (d) => val(d.tests.averageScore)],
    ["Tests taken", (d) => String(d.tests.taken)],
    ["Active misconceptions", (d) => String(d.activeMisconceptions.length)],
    ["Resolved misconceptions", (d) => String(d.resolvedMisconceptions.length)],
    ["Top misconception", (d) => d.activeMisconceptions[0]?.title || "–"],
    ["Weakest topic", (d) => d.weakTopics[0] || "–"],
    ["Strongest topic", (d) => d.strongTopics[0] || "–"],
    ["Last active", (d) => d.lastActive || "–"],
  ];
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5">
      <table className="w-full text-xs">
        <caption className="sr-only">Comparison of {ds.map((d) => d.name).join(", ")}</caption>
        <thead>
          <tr className="bg-neutral-50">
            <th scope="col" className="px-3 py-2 text-left font-semibold text-neutral-500">Metric</th>
            {ds.map((d) => (
              <th key={d.id} scope="col" className="px-3 py-2 text-left font-bold text-[#1F2230] whitespace-nowrap">
                {d.name} {d.sample && <SampleChip />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, get]) => (
            <tr key={label} className="border-t border-black/5">
              <th scope="row" className="px-3 py-2 text-left font-medium text-neutral-500 whitespace-nowrap">{label}</th>
              {ds.map((d) => (
                <td key={d.id} className="px-3 py-2 text-neutral-800">{get(d)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ClassCard: React.FC<{ s: ClassSummary }> = ({ s }) => (
  <div className="rounded-2xl border border-black/5 p-4 space-y-3">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Metric label="Mentees" value={`${s.mentees}${s.sampleStudents ? ` + ${s.sampleStudents} sample` : ""}`} />
      <Metric label="Avg mastery" value={val(s.averageMastery)} />
      <Metric label="Avg test score" value={val(s.averageTestScore)} />
      <Metric label="Active misconceptions" value={String(s.activeMisconceptions)} />
    </div>
    <div className="grid md:grid-cols-2 gap-3 text-xs">
      <div>
        <h4 className="font-bold text-[#1F2230]">Most common misconceptions</h4>
        <ul className="mt-1 space-y-1 text-neutral-700">
          {s.commonMisconceptions.slice(0, 5).map((m) => (
            <li key={m.title}>{m.title}: <strong>{m.students}</strong> student{m.students > 1 ? "s" : ""} ({m.occurrences}×)</li>
          ))}
          {s.commonMisconceptions.length === 0 && <li>None recorded.</li>}
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-[#1F2230]">Needs attention</h4>
        <ul className="mt-1 space-y-1 text-neutral-700">
          {s.needsAttention.map((n) => <li key={n.name}><strong>{n.name}</strong>: {n.reason}</li>)}
          {s.needsAttention.length === 0 && <li>No one stands out right now.</li>}
        </ul>
      </div>
    </div>
    {s.weakestTopics.length > 0 && (
      <p className="text-xs text-neutral-600">
        <strong>Weakest topics:</strong> {s.weakestTopics.slice(0, 4).map((t) => `${t.topic} (${t.averageMastery}%)`).join(", ")}
      </p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
export const TeacherInsightsChat: React.FC = () => {
  const { user } = useAuth();
  const teacherUid = user?.uid;
  const historyKey = `eduvia_teacher_insights_${teacherUid || "anon"}`;

  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(historyKey) || "[]");
      return Array.isArray(saved) ? saved.filter((m: Message) => !m.pending) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const cache = useRef(new Map<string, StudentDossier>());
  const logRef = useRef<HTMLDivElement>(null);

  const loadRoster = async () => {
    setRosterLoading(true);
    setRosterError(null);
    cache.current.clear();
    try {
      const [mentees, samples] = await Promise.all([
        mentorService.listMentees(teacherUid || ""),
        dataService.getStudentTelemetryProfiles().catch(() => []),
      ]);
      setRoster([
        ...mentees.map((m) => ({ id: m.uid, name: m.displayName || m.email || "Student", sample: false, profile: m })),
        ...samples.map((t) => ({ id: t.id, name: t.name, sample: true, telemetry: t })),
      ]);
    } catch (err) {
      console.warn("[Insights] Could not load mentees:", err);
      setRosterError("Couldn't load your mentees. Check your connection and refresh.");
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherUid]);

  useEffect(() => {
    localStorage.setItem(historyKey, JSON.stringify(messages.filter((m) => !m.pending).slice(-30)));
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, historyKey]);

  const dossierFor = async (entry: RosterEntry) => {
    const hit = cache.current.get(entry.id);
    if (hit) return hit;
    const d = await buildDossier(entry);
    cache.current.set(entry.id, d);
    return d;
  };

  const ask = async (question: string, explicit?: RosterEntry[]) => {
    const q = question.trim();
    if (!q || busy) return;
    const mentioned = explicit ?? findMentioned(q, roster);
    const targets = mentioned.slice(0, 6);
    const { scope, includeClass } = decideScope(q, targets);

    setBusy(true);
    setInput("");
    const history = messages
      .filter((m) => m.text && !m.error)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: q }, { role: "assistant", text: "", pending: true }]);

    let cards: Cards | undefined;
    let sources = "";
    try {
      const everyone = scope === "class" || includeClass ? await Promise.all(roster.map(dossierFor)) : [];
      const focus = await Promise.all(targets.map(dossierFor));
      const summary = everyone.length ? summariseClass(everyone) : null;
      cards =
        scope === "student" ? { kind: "student", dossier: focus[0] } : scope === "compare" ? { kind: "compare", dossiers: focus } : { kind: "class", summary: summary as ClassSummary, students: everyone };
      const used = scope === "class" ? everyone : focus;
      sources = `Based on ${used.length} student record${used.length === 1 ? "" : "s"}: ${used
        .map((d) => d.name + (d.sample ? " (sample)" : ""))
        .join(", ")}`;

      const context: Record<string, unknown> = {
        teacher: user?.displayName,
        today: new Date().toISOString().slice(0, 10),
        mentees: roster.filter((r) => !r.sample).length,
        sampleStudents: roster.filter((r) => r.sample).length,
      };
      if (scope === "class") context.students = everyone.map(compactDossier);
      else context.students = focus;
      if (summary) context.classSummary = summary;

      const { answer, provider } = await askInsights({ question: q, scope, context, history }, teacherUid);
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", text: answer, cards, sources, provider }]);
    } catch (err) {
      const message =
        err instanceof TutorError ? err.message : "Couldn't load the student records. Please try again.";
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", text: "", cards, sources, error: cards ? `${message} The data below is still accurate.` : message },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_SELECTED ? prev : [...prev, id]));
  const selectedEntries = roster.filter((r) => selected.includes(r.id));
  const visible = roster.filter((r) => r.name.toLowerCase().includes(filter.toLowerCase()));
  const realCount = roster.filter((r) => !r.sample).length;

  const examples = useMemo(() => {
    const names = roster.map((r) => r.name);
    return [
      names[0] && `How is ${names[0]} doing?`,
      names.length > 1 && `Compare ${names[0]} and ${names[1]}`,
      "What's the class average and the most common misconceptions?",
      "Who needs help this week, and why?",
    ].filter(Boolean) as string[];
  }, [roster]);

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* Roster / quick form */}
      <aside className={`${panel} p-5 space-y-4 h-fit`} aria-labelledby="roster-title">
        <div className="flex items-center justify-between">
          <h3 id="roster-title" className="flex items-center gap-2 font-bold text-[#1F2230]">
            <Users className="w-4 h-4 text-brand" /> Database Students & Mentees
          </h3>
          <button onClick={loadRoster} aria-label="Refresh mentees" className="p-1.5 rounded-lg text-neutral-500 hover:bg-black/5">
            <RefreshCw className={`w-4 h-4 ${rosterLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          {realCount} database student{realCount === 1 ? "" : "s"} loaded from DB. Tick up to {MAX_SELECTED} to summarise or compare.
        </p>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <label htmlFor="roster-filter" className="sr-only">Filter students</label>
          <input
            id="roster-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Find a student…"
            className="w-full rounded-xl border border-black/10 bg-white py-2 pl-8 pr-3 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        {rosterError && <p role="alert" className="text-xs text-rose-600">{rosterError}</p>}
        <ul className="max-h-72 overflow-y-auto space-y-1" aria-label="Students">
          {visible.map((r) => {
            const on = selected.includes(r.id);
            return (
              <li key={r.id}>
                <label className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm cursor-pointer transition ${on ? "bg-brand/10" : "hover:bg-black/5"}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={!on && selected.length >= MAX_SELECTED}
                    onChange={() => toggle(r.id)}
                    className="accent-brand"
                  />
                  <span className="flex-1 min-w-0 truncate text-neutral-800">{r.name}</span>
                  {!r.sample ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      DB Student
                    </span>
                  ) : (
                    <SampleChip />
                  )}
                </label>
              </li>
            );
          })}
          {!rosterLoading && realCount === 0 && (
            <li className="rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
              No registered students found in database.
            </li>
          )}
        </ul>
        <div className="grid gap-2">
          <button
            onClick={() => ask(`Give me a full summary of ${selectedEntries[0]?.name}: progress, strengths, weaknesses and misconception log.`, selectedEntries.slice(0, 1))}
            disabled={selectedEntries.length !== 1 || busy}
            className="h-9 rounded-xl bg-[#0B0E13] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <FileText className="w-3.5 h-3.5" /> Summarise selected
          </button>
          <button
            onClick={() => ask(`Mention and detail all active and resolved misconceptions for ${selectedEntries[0]?.name} explicitly.`, selectedEntries.slice(0, 1))}
            disabled={selectedEntries.length !== 1 || busy}
            className="h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Misconception log
          </button>
          <button
            onClick={() => ask(`Compare ${selectedEntries.map((e) => e.name).join(", ")}: mastery, test scores, misconceptions and who needs more support.`, selectedEntries)}
            disabled={selectedEntries.length < 2 || busy}
            className="h-9 rounded-xl bg-brand text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <GitCompare className="w-3.5 h-3.5" /> Compare selected
          </button>
          <button
            onClick={() => ask("Give me a class report: average mastery, average test score, mention all misconceptions per student and who needs attention.", [])}
            disabled={roster.length === 0 || busy}
            className="h-9 rounded-xl bg-black/5 text-neutral-800 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <Users className="w-3.5 h-3.5" /> Class report (all mentees)
          </button>
        </div>
      </aside>

      {/* Chat */}
      <section className={`${panel} flex flex-col min-w-0`} aria-labelledby="insights-title">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
          <div>
            <h3 id="insights-title" className="flex items-center gap-2 font-bold text-[#1F2230]">
              <Bot className="w-4 h-4 text-brand" /> Student Insights Assistant
            </h3>
            <p className="text-xs text-neutral-500">Answers come only from your mentees' recorded activity. Type a name or pick students on the left.</p>
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} aria-label="Clear conversation" className="p-2 rounded-xl text-neutral-500 hover:bg-black/5">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div ref={logRef} role="log" aria-live="polite" className="h-[min(62vh,620px)] overflow-y-auto p-5 space-y-5">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Bot className="w-10 h-10 text-brand" />
              <p className="mt-3 font-bold text-[#1F2230]">Ask about any of your students</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {examples.map((e) => (
                  <button
                    key={e}
                    onClick={() => ask(e)}
                    disabled={rosterLoading}
                    className="rounded-full border border-black/10 px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:border-brand transition"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-[28px] rounded-br-lg bg-[#0B0E13] px-4 py-3 text-sm text-white">{m.text}</div>
              </div>
            ) : (
              <div key={i} className="space-y-3">
                {m.pending ? (
                  <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="w-4 h-4 animate-spin" /> Reading student records…</p>
                ) : (
                  <>
                    {m.cards?.kind === "student" && <StudentCard d={m.cards.dossier} />}
                    {m.cards?.kind === "compare" && <CompareTable ds={m.cards.dossiers} />}
                    {m.cards?.kind === "class" && <ClassCard s={m.cards.summary} />}
                    {m.text && (
                      <div className="rounded-[28px] rounded-tl-lg bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-800">
                        <SimpleMarkdown text={m.text} />
                      </div>
                    )}
                    {m.error && (
                      <p role="alert" className="flex items-start gap-2 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {m.error}
                      </p>
                    )}
                    {(m.sources || m.provider) && (
                      <p className="text-[11px] text-neutral-400">
                        {m.sources}
                        {m.provider ? ` · written by ${m.provider === "groq" ? "Groq" : "Gemini"}` : ""}
                      </p>
                    )}
                  </>
                )}
              </div>
            )
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input, selectedEntries.length && !findMentioned(input, roster).length && /\b(them|these|selected|they|both)\b/i.test(input) ? selectedEntries : undefined);
          }}
          className="flex items-end gap-2 border-t border-black/5 p-4"
        >
          <label htmlFor="insights-input" className="sr-only">Ask about your students</label>
          <input
            id="insights-input"
            value={input}
            maxLength={1000}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. How is Aarav doing? · Compare Aarav and Bob · Class misconceptions"
            className="h-12 flex-1 min-w-0 rounded-2xl border border-black/10 bg-white px-4 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button type="submit" disabled={!input.trim() || busy || rosterLoading} aria-label="Ask" className="h-12 w-12 shrink-0 rounded-2xl bg-brand text-white grid place-items-center disabled:opacity-40">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </section>
    </div>
  );
};

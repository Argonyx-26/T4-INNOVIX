import React, { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { Bot, Flag, Loader2 } from "lucide-react";
import { db } from "../../firebase";
import { AiMisconceptionRecord, AiTestAttempt, REPEAT_THRESHOLD } from "../../services/dataService";

// Stored as UTC "YYYY-MM-DD HH:MM" (from toISOString) without a zone marker.
const parseDate = (s: string) => new Date(s.includes("T") ? s : `${s.replace(" ", "T")}Z`);
const ago = (s: string) => {
  const mins = Math.max(0, Math.round((Date.now() - parseDate(s).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

export const AiTestInsights: React.FC = () => {
  const [records, setRecords] = useState<AiMisconceptionRecord[]>([]);
  const [attempts, setAttempts] = useState<AiTestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubRecords = onSnapshot(
      query(collection(db, "misconceptions"), where("source", "==", "ai-test")),
      (snap) => {
        setRecords(snap.docs.map((d) => ({ ...(d.data() as AiMisconceptionRecord), id: d.id })));
        setLoading(false);
      },
      (err) => {
        console.warn("[Teacher] AI misconception feed:", err);
        setError("Couldn't load AI test misconceptions.");
        setLoading(false);
      }
    );
    const unsubAttempts = onSnapshot(
      query(collection(db, "ai_test_attempts"), orderBy("createdAt", "desc"), limit(8)),
      (snap) => setAttempts(snap.docs.map((d) => ({ ...(d.data() as AiTestAttempt), id: d.id }))),
      (err) => console.warn("[Teacher] AI test attempts feed:", err)
    );
    return () => {
      unsubRecords();
      unsubAttempts();
    };
  }, []);

  const flagged = useMemo(
    () => records.filter((r) => r.attemptCount >= REPEAT_THRESHOLD).sort((a, b) => b.attemptCount - a.attemptCount),
    [records]
  );
  const flaggedStudents = new Set(flagged.map((r) => r.studentId)).size;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <section aria-labelledby="ai-flags-title" className="xl:col-span-3 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="ai-flags-title" className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
            <Flag className="w-4 h-4 text-rose-500" />
            Repeated Misconceptions from AI Tests
          </h3>
          <span className="text-xs font-semibold text-rose-600 bg-rose-500/10 rounded-full px-2.5 py-1">
            {flagged.length} flagged · {flaggedStudents} student{flaggedStudents === 1 ? "" : "s"}
          </span>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Students appear here after making the same mistake {REPEAT_THRESHOLD}+ times in AI-generated tests.
        </p>

        <div className="mt-4 space-y-2.5" aria-live="polite">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</p>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : flagged.length === 0 ? (
            <p className="rounded-2xl bg-black/5 dark:bg-white/5 px-4 py-3 text-sm text-neutral-500">No repeated misconceptions yet.</p>
          ) : (
            flagged.map((r) => (
              <div key={r.id} className="rounded-2xl border border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-[#17171B] px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">{r.identifiedMisconception}</div>
                  <div className="text-xs text-neutral-500">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">{r.studentName}</span> · {r.conceptName} · last seen {ago(r.lastAttempt)}
                  </div>
                  {r.explanation && <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{r.explanation}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-bold text-rose-600">{r.attemptCount}×</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section aria-labelledby="ai-attempts-title" className="xl:col-span-2 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 p-6 shadow-sm">
        <h3 id="ai-attempts-title" className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
          <Bot className="w-4 h-4 text-[#8266F0]" /> Recent AI Tests
        </h3>
        <div className="mt-4 space-y-2.5">
          {attempts.length === 0 ? (
            <p className="rounded-2xl bg-black/5 dark:bg-white/5 px-4 py-3 text-sm text-neutral-500">No AI tests taken yet.</p>
          ) : (
            attempts.map((a) => {
              const pct = Math.round((a.score / Math.max(1, a.total)) * 100);
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 dark:bg-[#17171B] px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-neutral-900 dark:text-white truncate">{a.studentName}</div>
                    <div className="text-xs text-neutral-500 truncate">
                      {a.topic} · {a.difficulty} · {ago(a.createdAt)}
                      {a.misconceptions.length > 0 && ` · ${a.misconceptions.length} misconception${a.misconceptions.length === 1 ? "" : "s"}`}
                    </div>
                  </div>
                  <span className={`shrink-0 text-sm font-extrabold ${pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-rose-600"}`}>
                    {a.score}/{a.total}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

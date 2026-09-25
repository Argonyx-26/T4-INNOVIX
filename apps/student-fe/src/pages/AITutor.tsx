import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  ClipboardCheck,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MessageSquare,
  Flag,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeModeContext";
import { dataService, AiMisconceptionRecord, REPEAT_THRESHOLD } from "../services/dataService";
import { tutorService, TutorError, ChatMessage, Difficulty, GeneratedTest, TestAnalysis } from "../services/tutorService";
import { AnswerOption, PhaseChip } from "../components/diagnostic/DiagnosticTemplate";
import { SimpleMarkdown } from "../components/SimpleMarkdown";

export const PENDING_TUTOR_TOPIC_KEY = "eduvia_tutor_topic";

type StoredMessage = ChatMessage & { provider?: string };
type Phase = "setup" | "loading" | "taking" | "submitting" | "results";

const DIFFICULTIES: { id: Difficulty; label: string; hint: string }[] = [
  { id: "easy", label: "Easy", hint: "Core ideas and definitions" },
  { id: "medium", label: "Medium", hint: "Apply the concept" },
  { id: "hard", label: "Hard", hint: "Multi-step and tricky cases" },
];
const COUNTS = [5, 10, 15];
const CHAT_SUGGESTIONS = [
  "Why is a negative times a negative positive?",
  "Explain Newton's first law with an everyday example",
  "How does binary search work?",
  "What's the difference between mitosis and meiosis?",
];
const PROVIDER_LABEL: Record<string, string> = { gemini: "Gemini", groq: "Groq" };

const readChat = (key: string): StoredMessage[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string") : [];
  } catch {
    return [];
  }
};

const card = "rounded-[28px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]";
const primaryBtn =
  "h-11 px-6 rounded-full bg-[#8266F0] hover:bg-[#6F52E6] text-white text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed";
const secondaryBtn =
  "h-11 px-5 rounded-full bg-[#EDEDEC] hover:bg-[#E2E2E0] text-[#141414] text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50";

export const AITutor: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useThemeMode();
  const uid = user?.uid;
  const chatKey = `eduvia_tutor_chat_${uid || "guest"}`;

  const [pendingTopic] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(PENDING_TUTOR_TOPIC_KEY);
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.removeItem(PENDING_TUTOR_TOPIC_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const [tab, setTab] = useState<"chat" | "test">(pendingTopic ? "test" : "chat");

  // ---------------- Chat ----------------
  const [messages, setMessages] = useState<StoredMessage[]>(() => readChat(chatKey));
  const [input, setInput] = useState("");
  const [chatTopic, setChatTopic] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem(chatKey, JSON.stringify(messages.slice(-40)));
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatKey]);

  const requestReply = async (history: StoredMessage[], topic = chatTopic) => {
    setSending(true);
    setChatError(null);
    try {
      const payload = history.slice(-20).map(({ role, content }) => ({ role, content }));
      const { reply, provider } = await tutorService.chat(payload, topic, uid);
      setMessages([...history, { role: "assistant", content: reply, provider }]);
    } catch (err) {
      setChatError(err instanceof TutorError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const sendChat = (text?: string, topic?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    const next: StoredMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    requestReply(next, topic);
  };

  const lastIsUnanswered = messages.length > 0 && messages[messages.length - 1].role === "user";

  // ---------------- Tests ----------------
  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState(pendingTopic || "");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(5);
  const [test, setTest] = useState<GeneratedTest | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [result, setResult] = useState<TestAnalysis | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const savedTestIds = useRef(new Set<string>());

  const [memory, setMemory] = useState<AiMisconceptionRecord[]>([]);
  const [memoryLoading, setMemoryLoading] = useState(true);
  useEffect(() => {
    if (!uid) {
      setMemoryLoading(false);
      return;
    }
    dataService
      .getAiMisconceptions(uid)
      .then(setMemory)
      .catch((err) => console.warn("[AI Tutor] Could not load past mistakes:", err))
      .finally(() => setMemoryLoading(false));
  }, [uid]);

  const startTest = async (overrideTopic?: string) => {
    const t = (overrideTopic ?? topic).trim();
    if (!t) {
      setTestError("Enter a topic to be tested on.");
      return;
    }
    setTopic(t);
    setTestError(null);
    setPhase("loading");
    try {
      const generated = await tutorService.generateTest(
        {
          topic: t,
          difficulty,
          count,
          known_misconceptions: memory.slice(0, 30).map((m) => ({ key: m.misconceptionKey, title: m.identifiedMisconception })),
        },
        uid
      );
      setTest(generated);
      setAnswers({});
      setCurrent(0);
      setConfirmSubmit(false);
      setResult(null);
      setSaveState("idle");
      setPhase("taking");
    } catch (err) {
      setTestError(err instanceof TutorError ? err.message : "Couldn't create the test. Please try again.");
      setPhase("setup");
    }
  };

  const saveResult = async (analysis: TestAnalysis) => {
    if (!uid || savedTestIds.current.has(analysis.test_id)) return;
    if (analysis.misconceptions.length === 0 && analysis.total === 0) return;
    setSaveState("saving");
    try {
      const updated = await dataService.recordAiTestResult(uid, user?.displayName || "Student", analysis, memory);
      savedTestIds.current.add(analysis.test_id);
      setMemory((prev) => [...updated, ...prev.filter((p) => !updated.some((u) => u.id === p.id))]);
      setSaveState("saved");
      const newlyFlagged = updated.filter((u) => u.flagged && !memory.find((m) => m.id === u.id)?.flagged);
      if (newlyFlagged.length) {
        showToast(
          "Shared with Your Teacher",
          `"${newlyFlagged[0].identifiedMisconception}" has come up ${REPEAT_THRESHOLD}+ times, so your teacher can help with it.`,
          "info"
        );
      }
    } catch (err) {
      console.warn("[AI Tutor] Failed to save test result:", err);
      setSaveState("failed");
    }
  };

  const submitTest = async () => {
    if (!test) return;
    setConfirmSubmit(false);
    setPhase("submitting");
    setTestError(null);
    try {
      const all = Object.fromEntries(test.questions.map((q) => [q.id, answers[q.id] ?? null]));
      const analysis = await tutorService.analyzeTest(test.token, all, uid);
      setResult(analysis);
      setPhase("results");
      saveResult(analysis);
    } catch (err) {
      setTestError(err instanceof TutorError ? err.message : "Couldn't grade the test. Please try again.");
      setPhase("taking");
    }
  };

  const quitTest = () => {
    if (window.confirm("Leave this test? Your answers will be lost.")) {
      setPhase("setup");
      setTest(null);
    }
  };

  const askTutorAboutMistakes = () => {
    if (!result) return;
    const wrong = result.results.filter((r) => !r.is_correct);
    const lines = wrong
      .slice(0, 5)
      .map((r) => `- ${r.question} (I chose: ${r.chosen_text || "no answer"}; correct: ${r.correct_text})`);
    const msg = `I just took a ${result.difficulty} test on ${result.topic} and scored ${result.score}/${result.total}. Can you help me understand where I went wrong?\n${lines.join("\n")}`;
    setChatTopic(result.topic);
    setTab("chat");
    sendChat(msg, result.topic);
  };

  const unanswered = test ? test.questions.filter((q) => !answers[q.id]).length : 0;
  const q = test?.questions[current];
  const sortedMemory = useMemo(() => [...memory].sort((a, b) => b.attemptCount - a.attemptCount), [memory]);
  const totalFor = (key: string) => memory.find((m) => m.misconceptionKey === key)?.attemptCount;

  // ---------------- Render ----------------
  const renderChat = () => (
    <section className={`${card} flex flex-col`} aria-label="Tutor chat">
      <div className="flex flex-wrap items-center gap-2 border-b border-black/10 p-4">
        <label htmlFor="chat-topic" className="sr-only">Topic you're studying</label>
        <input
          id="chat-topic"
          value={chatTopic}
          onChange={(e) => setChatTopic(e.target.value.slice(0, 120))}
          placeholder="What are you studying? (optional)"
          className="h-10 min-w-0 flex-1 rounded-full border border-black/10 bg-[#F6F3F0] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
        />
        <button
          onClick={() => {
            setTopic(chatTopic);
            setTab("test");
          }}
          disabled={!chatTopic.trim()}
          className="h-10 px-4 rounded-full bg-[#141414] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition"
        >
          <ClipboardCheck className="w-4 h-4" /> Test me on this
        </button>
        <button
          onClick={() => {
            setMessages([]);
            setChatError(null);
          }}
          disabled={messages.length === 0 || sending}
          aria-label="Clear chat"
          className="h-10 w-10 grid place-items-center rounded-full bg-[#EDEDEC] hover:bg-[#E2E2E0] disabled:opacity-40 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div ref={logRef} role="log" aria-live="polite" className="h-[min(58vh,540px)] overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <span className="w-14 h-14 rounded-2xl bg-[#EEE8FD] grid place-items-center text-[#6B4FD8]">
              <Bot className="w-7 h-7" />
            </span>
            <h2 className="mt-4 font-display text-xl font-bold text-[#141414]">Ask me anything you're learning</h2>
            <p className="mt-1 text-sm text-[#6B6B6B] max-w-sm">I'll explain step by step and check your understanding along the way.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {CHAT_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendChat(s)}
                  className="rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-[#1F1F1F] hover:border-[#8266F0] hover:bg-[#F7F5FF] transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start gap-2.5"}`}>
            {m.role === "assistant" && (
              <span className="mt-1 w-8 h-8 shrink-0 rounded-full bg-[#EEE8FD] grid place-items-center text-[#6B4FD8]">
                <Bot className="w-4 h-4" />
              </span>
            )}
            <div
              className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user" ? "bg-[#1F2230] text-white rounded-br-lg whitespace-pre-wrap" : "bg-[#F4F1EE] text-[#1F1F1F] rounded-tl-lg"
              }`}
            >
              {m.role === "assistant" ? <SimpleMarkdown text={m.content} /> : m.content}
              {m.provider && <div className="mt-2 text-[10px] font-semibold text-[#8A8C95]">Answered by {PROVIDER_LABEL[m.provider] || m.provider}</div>}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
            <Loader2 className="w-4 h-4 animate-spin" /> Tutor is thinking…
          </div>
        )}
        {chatError && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#7F1D1D]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{chatError}</span>
            {lastIsUnanswered && (
              <button onClick={() => requestReply(messages)} className="font-bold underline">
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendChat();
        }}
        className="flex items-end gap-2 border-t border-black/10 p-4"
      >
        <label htmlFor="chat-input" className="sr-only">Message the tutor</label>
        <textarea
          id="chat-input"
          ref={inputRef}
          rows={1}
          value={input}
          maxLength={4000}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendChat();
            }
          }}
          placeholder="Ask a question… (Shift+Enter for a new line)"
          className="min-h-[48px] flex-1 resize-none rounded-3xl border border-black/10 bg-[#F6F3F0] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
        />
        <button type="submit" disabled={!input.trim() || sending} aria-label="Send" className="h-12 w-12 shrink-0 rounded-full bg-[#8266F0] hover:bg-[#6F52E6] text-white grid place-items-center disabled:opacity-40 transition">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </section>
  );

  const renderSetup = () => (
    <section className={`${card} p-6 sm:p-8 space-y-6`} aria-labelledby="test-setup-title">
      <div>
        <PhaseChip tone="purple" icon={Sparkles}>AI-generated test</PhaseChip>
        <h2 id="test-setup-title" className="mt-3 font-display text-2xl font-bold text-[#141414]">Test yourself on any topic</h2>
        <p className="mt-1 text-sm text-[#6B6B6B]">
          One question at a time. You'll see your score, the misconceptions behind your mistakes, and explanations at the end.
        </p>
      </div>
      <div>
        <label htmlFor="test-topic" className="text-sm font-bold text-[#141414]">Topic</label>
        <input
          id="test-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value.slice(0, 120))}
          onKeyDown={(e) => e.key === "Enter" && startTest()}
          placeholder="e.g. Quadratic equations, Photosynthesis, SQL joins"
          className="mt-2 h-12 w-full rounded-2xl border border-black/10 bg-[#F6F3F0] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
        />
        {sortedMemory.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-[#6B6B6B] py-1">Revisit:</span>
            {Array.from(new Set(sortedMemory.map((m) => m.conceptName))).slice(0, 4).map((t) => (
              <button key={t} onClick={() => setTopic(t)} className="rounded-full bg-[#EDEDEC] hover:bg-[#E2E2E0] px-3 py-1 text-xs font-semibold transition">
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
      <fieldset>
        <legend className="text-sm font-bold text-[#141414]">Difficulty</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={difficulty === d.id}
              onClick={() => setDifficulty(d.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                difficulty === d.id ? "border-[#8266F0] bg-[#F3F0FF] ring-2 ring-[#8266F0]/30" : "border-[#E3E3E1] hover:border-[#8266F0]"
              }`}
            >
              <span className="block text-sm font-bold text-[#141414]">{d.label}</span>
              <span className="block text-xs text-[#6B6B6B]">{d.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-bold text-[#141414]">Number of questions</legend>
        <div className="mt-2 flex gap-2">
          {COUNTS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={count === c}
              onClick={() => setCount(c)}
              className={`h-10 w-16 rounded-full text-sm font-bold transition ${count === c ? "bg-[#141414] text-white" : "bg-[#EDEDEC] hover:bg-[#E2E2E0]"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>
      {testError && (
        <p role="alert" className="flex items-center gap-2 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#7F1D1D]">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {testError}
        </p>
      )}
      <button onClick={() => startTest()} disabled={!topic.trim()} className={`${primaryBtn} w-full sm:w-auto`}>
        Generate my test <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );

  const renderTaking = () => {
    if (!test || !q) return null;
    const chosen = answers[q.id];
    const isLast = current === test.questions.length - 1;
    return (
      <section className={`${card} p-6 sm:p-8`} aria-labelledby="question-title">
        <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-9 h-9 shrink-0 rounded-full bg-[#EDEDEC] grid place-items-center text-xs font-bold">
              {String(current + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h2 id="question-title" className="font-display font-bold text-base text-[#141414]">
                Question {current + 1} of {test.questions.length}
              </h2>
              <p className="text-xs text-[#6B6B6B] truncate">
                {test.topic} · {test.difficulty[0].toUpperCase() + test.difficulty.slice(1)}
              </p>
            </div>
          </div>
          <button onClick={quitTest} className="h-9 px-3.5 rounded-full bg-[#EDEDEC] hover:bg-[#E2E2E0] text-xs font-semibold flex items-center gap-1.5 transition shrink-0">
            <X className="w-3.5 h-3.5" /> Quit
          </button>
        </div>

        <div className="mt-5 h-2 rounded-full bg-[#E5E5E4] overflow-hidden" role="progressbar" aria-label="Questions answered" aria-valuenow={test.questions.length - unanswered} aria-valuemin={0} aria-valuemax={test.questions.length}>
          <div className="h-full rounded-full bg-[#8266F0] transition-[width] duration-300" style={{ width: `${((test.questions.length - unanswered) / test.questions.length) * 100}%` }} />
        </div>

        <p className="mt-6 text-lg font-bold text-[#141414] leading-snug">{q.question}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="question-title">
          {q.options.map((o) => (
            <AnswerOption
              key={o.id}
              label={`${o.id}. ${o.text}`}
              state={chosen === o.id ? "selected" : "idle"}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
            />
          ))}
        </div>

        <nav aria-label="Questions" className="mt-6 flex flex-wrap gap-1.5">
          {test.questions.map((qq, i) => (
            <button
              key={qq.id}
              onClick={() => setCurrent(i)}
              aria-label={`Question ${i + 1}${answers[qq.id] ? ", answered" : ""}`}
              aria-current={i === current ? "step" : undefined}
              className={`w-8 h-8 rounded-full text-xs font-bold transition ${
                i === current ? "bg-[#141414] text-white" : answers[qq.id] ? "bg-[#E5DEFD] text-[#4B32B8]" : "bg-[#EDEDEC] text-[#6B6B6B]"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </nav>

        {testError && (
          <p role="alert" className="mt-4 flex items-center gap-2 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#7F1D1D]">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {testError}
          </p>
        )}

        {confirmSubmit ? (
          <div role="alertdialog" aria-label="Submit with unanswered questions" className="mt-6 rounded-2xl bg-[#FFF7E6] p-4 text-sm text-[#5C4200]">
            <p>
              You have <strong>{unanswered}</strong> unanswered question{unanswered === 1 ? "" : "s"}. Unanswered questions count as incorrect.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={submitTest} className={primaryBtn}>Submit anyway</button>
              <button onClick={() => { setConfirmSubmit(false); setCurrent(test.questions.findIndex((x) => !answers[x.id])); }} className={secondaryBtn}>
                Go to first unanswered
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className={secondaryBtn}>
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            {isLast ? (
              <button onClick={() => (unanswered > 0 ? setConfirmSubmit(true) : submitTest())} className={primaryBtn}>
                Finish test <CheckCircle2 className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setCurrent((c) => c + 1)} className={primaryBtn}>
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </section>
    );
  };

  const renderResults = () => {
    if (!result) return null;
    const pct = Math.round((result.score / Math.max(1, result.total)) * 100);
    return (
      <div className="space-y-6">
        <section className={`${card} p-6 sm:p-8`} aria-labelledby="results-title">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div
              className="w-28 h-28 shrink-0 rounded-full grid place-items-center mx-auto sm:mx-0"
              style={{ background: `conic-gradient(${pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444"} ${pct * 3.6}deg, #E5E5E4 0deg)` }}
              role="img"
              aria-label={`Score ${pct} percent`}
            >
              <div className="w-[92px] h-[92px] rounded-full bg-white grid place-items-center">
                <div className="text-center">
                  <div className="text-2xl font-extrabold text-[#141414]">{pct}%</div>
                  <div className="text-[11px] text-[#6B6B6B]">{result.score}/{result.total}</div>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <PhaseChip tone={pct >= 70 ? "green" : "amber"} icon={CheckCircle2}>Test complete</PhaseChip>
              <h2 id="results-title" className="mt-2 font-display text-2xl font-bold text-[#141414]">{result.topic}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#4B4B4B]">{result.analysis.summary}</p>
              <p className="mt-2 text-xs text-[#6B6B6B]">
                {result.answered} of {result.total} answered · {result.difficulty}
                {result.provider ? ` · analysed by ${PROVIDER_LABEL[result.provider] || result.provider}` : ""}
              </p>
            </div>
          </div>

          {saveState === "failed" && (
            <p role="alert" className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-[#FDECEC] px-4 py-3 text-sm text-[#7F1D1D]">
              <AlertTriangle className="w-4 h-4 shrink-0" /> We couldn't save these results, so your teacher won't see them yet.
              <button onClick={() => saveResult(result)} className="font-bold underline">Try again</button>
            </p>
          )}
          {saveState === "saving" && <p className="mt-5 text-xs text-[#6B6B6B] flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving your results…</p>}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { title: "Strengths", items: result.analysis.strengths, tone: "bg-[#E7F8F0] text-[#065F46]" },
              { title: "Focus areas", items: result.analysis.focus_areas, tone: "bg-[#FFF7E6] text-[#5C4200]" },
              { title: "Next steps", items: result.analysis.next_steps, tone: "bg-[#F3F0FF] text-[#2A1B6B]" },
            ]
              .filter((b) => b.items.length)
              .map((b) => (
                <div key={b.title} className={`rounded-2xl p-4 ${b.tone}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider">{b.title}</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                    {b.items.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => startTest(result.topic)} className={primaryBtn}>
              <RotateCcw className="w-4 h-4" /> Retake with new questions
            </button>
            {result.score < result.total && (
              <button onClick={askTutorAboutMistakes} className={secondaryBtn}>
                <MessageSquare className="w-4 h-4" /> Ask the tutor about my mistakes
              </button>
            )}
            <button onClick={() => { setPhase("setup"); setTest(null); setTopic(""); }} className={secondaryBtn}>New topic</button>
          </div>
        </section>

        {result.misconceptions.length > 0 && (
          <section className={`${card} p-6 sm:p-8`} aria-labelledby="misconceptions-title">
            <h2 id="misconceptions-title" className="font-display text-xl font-bold text-[#141414]">Misconceptions found</h2>
            <div className="mt-4 space-y-3">
              {result.misconceptions.map((m) => {
                const total = totalFor(m.key) ?? m.count;
                const flagged = total >= REPEAT_THRESHOLD;
                return (
                  <div key={m.key} className="rounded-2xl border border-[#E3E3E1] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-[#141414]">{m.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${flagged ? "bg-[#F4CACA] text-[#7F1D1D]" : "bg-[#FDE7B0] text-[#7C5300]"}`}>
                        {flagged ? `Repeated ${total}× · shared with teacher` : `${m.count}× in this test · ${total} total`}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#4B4B4B]">{m.explanation}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className={`${card} p-6 sm:p-8`} aria-labelledby="review-title">
          <h2 id="review-title" className="font-display text-xl font-bold text-[#141414]">Question review</h2>
          <ol className="mt-4 space-y-4">
            {result.results.map((r, i) => (
              <li key={r.id} className="rounded-2xl border border-[#E3E3E1] p-4">
                <div className="flex items-start gap-3">
                  {r.is_correct ? <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981]" aria-label="Correct" /> : <XCircle className="w-5 h-5 shrink-0 text-[#EF4444]" aria-label="Incorrect" />}
                  <div className="min-w-0 space-y-1.5">
                    <p className="font-semibold text-[#141414]">{i + 1}. {r.question}</p>
                    {!r.is_correct && (
                      <p className="text-sm text-[#7F1D1D]">Your answer: {r.chosen_text ? `${r.chosen_id}. ${r.chosen_text}` : "not answered"}</p>
                    )}
                    <p className="text-sm text-[#065F46]">Correct answer: {r.correct_id}. {r.correct_text}</p>
                    {r.explanation && <p className="text-sm text-[#4B4B4B]">{r.explanation}</p>}
                    {r.misconception && (
                      <p className="text-xs text-[#7C5300] bg-[#FFF7E6] rounded-xl px-3 py-2">
                        <strong>Misconception:</strong> {r.misconception.title}. {r.misconception.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  };

  const renderTest = () => {
    if (phase === "loading" || phase === "submitting") {
      return (
        <section className={`${card} p-10 text-center`} aria-live="polite">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#8266F0]" />
          <p className="mt-3 font-semibold text-[#141414]">{phase === "loading" ? `Writing your ${difficulty} test on ${topic}…` : "Checking your answers…"}</p>
          <p className="mt-1 text-xs text-[#6B6B6B]">This usually takes a few seconds.</p>
        </section>
      );
    }
    if (phase === "taking") return renderTaking();
    if (phase === "results") return renderResults();
    return renderSetup();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-[#141414]">AI Tutor</h1>
          <p className="text-sm text-[#6B6B6B]">Learn by chatting, then test yourself on any topic.</p>
        </div>
        <div role="tablist" aria-label="AI tutor mode" className="flex gap-2 rounded-full bg-[#F4EDE7] p-1">
          {([
            { id: "chat", label: "Chat", icon: MessageSquare },
            { id: "test", label: "Topic test", icon: ClipboardCheck },
          ] as const).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`h-10 px-5 rounded-full text-sm font-semibold flex items-center gap-2 transition ${
                tab === t.id ? "bg-[#0B0E13] text-white" : "text-[#1F2230] hover:bg-white/60"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="min-w-0" role="tabpanel">{tab === "chat" ? renderChat() : renderTest()}</div>

        <aside className="min-w-0 rounded-[28px] bg-[#E8E8E6] p-4" aria-labelledby="repeat-title">
          <h2 id="repeat-title" className="font-sans flex items-center gap-2 px-1 pb-1 text-xs font-bold text-[#141414]">
            <Flag className="w-4 h-4" /> Your repeated mistakes
          </h2>
          <p className="px-1 pb-3 text-[11px] text-[#6B6B6B]">
            A mistake that comes up {REPEAT_THRESHOLD} times in AI tests is shared with your teacher so they can help.
          </p>
          <div className="space-y-2.5">
            {memoryLoading ? (
              <p className="rounded-2xl bg-white px-4 py-3 text-xs text-[#6B6B6B]">Loading…</p>
            ) : sortedMemory.length === 0 ? (
              <p className="rounded-2xl bg-white px-4 py-3 text-xs text-[#6B6B6B]">No mistakes recorded yet. Take a topic test to get started.</p>
            ) : (
              sortedMemory.slice(0, 6).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setTopic(m.conceptName);
                    setTab("test");
                    if (phase !== "taking") setPhase("setup");
                  }}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-left hover:shadow-md transition"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-[#141414]">{m.identifiedMisconception}</span>
                      <span className="block text-[11px] text-[#6B6B6B] truncate">{m.conceptName}</span>
                    </span>
                    {m.flagged && <span className="shrink-0 rounded-full bg-[#F4CACA] px-2 py-0.5 text-[10px] font-bold text-[#7F1D1D]">Shared</span>}
                  </span>
                  <span className="mt-2 flex items-center gap-1.5" aria-label={`${m.attemptCount} of ${REPEAT_THRESHOLD} before sharing`}>
                    {Array.from({ length: REPEAT_THRESHOLD }).map((_, i) => (
                      <span key={i} className={`h-1.5 flex-1 rounded-full ${i < m.attemptCount ? (m.flagged ? "bg-[#EF4444]" : "bg-[#F59E0B]") : "bg-[#E5E5E4]"}`} />
                    ))}
                    <span className="ml-1 text-[10px] font-semibold text-[#6B6B6B]">{m.attemptCount}×</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

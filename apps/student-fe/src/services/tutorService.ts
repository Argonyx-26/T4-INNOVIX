export type Difficulty = "easy" | "medium" | "hard";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TestQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
}

export interface GeneratedTest {
  test_id: string;
  topic: string;
  difficulty: Difficulty;
  discipline: string;
  provider: string;
  token: string;
  questions: TestQuestion[];
}

export interface MisconceptionFinding {
  key: string;
  title: string;
  explanation: string;
  count: number;
  question_ids: string[];
}

export interface QuestionResult {
  id: string;
  question: string;
  chosen_id: string | null;
  chosen_text: string | null;
  correct_id: string;
  correct_text: string;
  is_correct: boolean;
  explanation: string;
  misconception: { key: string; title: string; explanation: string } | null;
}

export interface TestAnalysis {
  test_id: string;
  topic: string;
  difficulty: Difficulty;
  discipline: string;
  score: number;
  total: number;
  answered: number;
  results: QuestionResult[];
  misconceptions: MisconceptionFinding[];
  analysis: { summary: string; strengths: string[]; focus_areas: string[]; next_steps: string[] };
  provider: string | null;
}

export class TutorError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

async function post<T>(path: string, body: unknown, uid?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer mock-${uid || "anonymous"}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new TutorError("Can't reach the Eduvia server. Check that the backend is running.", "network");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 429) throw new TutorError("You're going a bit fast. Wait a moment and try again.", "rate_limited");
    throw new TutorError(data.error || `Request failed (${res.status}).`, data.code);
  }
  return data as T;
}

export const tutorService = {
  chat: (messages: ChatMessage[], topic: string, uid?: string) =>
    post<{ reply: string; provider: string }>("/tutor/chat/", { messages, topic }, uid),

  generateTest: (
    params: { topic: string; difficulty: Difficulty; count: number; known_misconceptions: { key: string; title: string }[] },
    uid?: string
  ) => post<GeneratedTest>("/tutor/test/generate/", params, uid),

  analyzeTest: (token: string, answers: Record<string, string | null>, uid?: string) =>
    post<TestAnalysis>("/tutor/test/analyze/", { token, answers }, uid),
};

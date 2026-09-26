/**
 * Voice / typed command parser for the LearnLens assistant.
 * Pure: takes the heard text and the current role, returns what to say and what to do.
 */

export const VOICE_HINT_KEY = "eduvia_voice_hint";
export const COURSE_FILTER_KEY = "eduvia_course_filter";
export const VOICE_HINT_EVENT = "eduvia:voice-hint";
export const COURSE_FILTER_EVENT = "eduvia:course-filter";

export type CourseFilterCategory =
  | "All"
  | "School (K-12)"
  | "Undergraduate (UG)"
  | "Postgraduate (PG)"
  | "Foundations"
  | "Advanced"
  | "Bookmarked";

export interface CourseFilterRequest {
  filter: CourseFilterCategory;
  query: string;
}

export type VoiceAction =
  | { type: "navigate"; hash: string }
  | { type: "hint" }
  | { type: "filter"; request: CourseFilterRequest }
  | { type: "role"; role: "student" | "teacher" }
  | { type: "help" }
  | { type: "none" };

export interface VoiceCommandResult {
  reply: string;
  action: VoiceAction;
}

export const SAMPLE_COMMANDS = [
  "nav:diagnostic",
  "give me a hint",
  "nav:library",
  "filter:class 9",
  "nav:pacing",
  "toggle:teacher",
  "help",
];

export const HELP_LINES = [
  "nav:<page> or \"open <page>\": dashboard, diagnostic, tutor, courses, library, pacing, plan, report, misconceptions, paths, mentors, settings",
  "\"give me a hint\": opens the diagnostic with the first hint shown",
  "filter:<level>: class 1-12, undergraduate, postgraduate, foundations, advanced, bookmarked, or any topic",
  "toggle:teacher / toggle:student: switch portal view",
];

interface PageDef {
  hash: string;
  label: string;
  words: string[];
}

const STUDENT_PAGES: PageDef[] = [
  { hash: "#diagnostic", label: "the LearnLens diagnostic", words: ["diagnostic", "challenge", "learnlens"] },
  { hash: "#diagnostic-results", label: "your cognitive report", words: ["report", "results", "cognitive"] },
  { hash: "#library", label: "the resource library", words: ["library", "resource", "resources", "material", "materials"] },
  { hash: "#pacing", label: "adaptive pacing", words: ["pacing", "pace", "simulator"] },
  { hash: "#courses", label: "the course catalogue", words: ["courses", "course", "curriculum", "syllabus", "catalogue", "catalog"] },
  { hash: "#ai-tutor", label: "the AI tutor", words: ["tutor", "practice", "quiz", "test", "chatbot"] },
  { hash: "#misconceptions", label: "your misconception log", words: ["misconception", "misconceptions", "mistakes", "mistake"] },
  { hash: "#plan", label: "your study plan", words: ["plan", "schedule", "tasks"] },
  { hash: "#paths", label: "your learning path", words: ["path", "paths", "journey"] },
  { hash: "#mentors", label: "the mentors page", words: ["mentor", "mentors", "instructor", "instructors", "faculty"] },
  { hash: "#self-study", label: "self study", words: ["self study", "selfstudy"] },
  { hash: "#settings", label: "settings", words: ["settings", "preferences", "profile"] },
  { hash: "#student", label: "your dashboard", words: ["dashboard", "home"] },
];

const TEACHER_PAGES: PageDef[] = [
  { hash: "#teacher-triage", label: "the triage board", words: ["triage", "kanban", "alerts"] },
  { hash: "#teacher-students", label: "student comparison", words: ["students", "student", "comparison", "compare"] },
  { hash: "#teacher-analytics", label: "class analytics", words: ["analytics", "heatmap"] },
  { hash: "#teacher-interventions", label: "remedial pods", words: ["interventions", "intervention", "pods", "remedial"] },
  { hash: "#teacher-intelligence", label: "the insights assistant", words: ["intelligence", "insights", "rag", "assistant", "chatbot"] },
  { hash: "#library", label: "the resource library", words: ["library", "resource", "resources"] },
  { hash: "#courses", label: "the course catalogue", words: ["courses", "course", "curriculum"] },
  { hash: "#settings", label: "settings", words: ["settings", "profile"] },
  { hash: "#teacher", label: "the teacher overview", words: ["dashboard", "home", "overview"] },
];

const FILLER = /\b(please|can you|could you|would you|go to|goto|navigate to|take me to|open up|open|show me|show|launch|start|the|my|page|section|view|now)\b/g;

const normalise = (text: string) =>
  text
    .toLowerCase()
    .replace(/[“”"'.!?,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasWord = (text: string, word: string) =>
  word.includes(" ") ? text.includes(word) : new RegExp(`\\b${word}\\b`).test(text);

const findPage = (text: string, role: "student" | "teacher"): PageDef | undefined => {
  const pages = role === "teacher" ? TEACHER_PAGES : STUDENT_PAGES;
  return pages.find((p) => p.words.some((w) => hasWord(text, w)));
};

export const parseCourseFilter = (raw: string): CourseFilterRequest => {
  const text = normalise(raw).replace(/\b(courses?|for|only|filter|by|level)\b/g, " ").replace(/\s+/g, " ").trim();
  if (/\b(class|grade|std|standard)\s*(\d{1,2})\b/.test(text) || /\b(school|k-?12)\b/.test(text)) {
    return { filter: "School (K-12)", query: "" };
  }
  if (/\b(ug|undergrad|undergraduate|college|bachelor)\b/.test(text)) return { filter: "Undergraduate (UG)", query: "" };
  if (/\b(pg|postgrad|postgraduate|masters?|graduate)\b/.test(text)) return { filter: "Postgraduate (PG)", query: "" };
  if (/\b(foundation|foundations|beginner|basics?)\b/.test(text)) return { filter: "Foundations", query: "" };
  if (/\badvanced\b/.test(text)) return { filter: "Advanced", query: "" };
  if (/\b(bookmark|bookmarked|bookmarks|saved)\b/.test(text)) return { filter: "Bookmarked", query: "" };
  if (!text || /^(all|clear|none|reset)$/.test(text)) return { filter: "All", query: "" };
  return { filter: "All", query: text };
};

const describeFilter = (raw: string, req: CourseFilterRequest) => {
  const cls = normalise(raw).match(/\b(class|grade|std|standard)\s*(\d{1,2})\b/);
  if (cls) return `Class ${cls[2]} is School level, so I'm showing School (K-12) courses.`;
  if (req.query) return `Showing courses matching "${req.query}".`;
  if (req.filter === "All") return "Showing all courses.";
  if (req.filter === "Bookmarked") return "Showing your bookmarked courses.";
  return `Showing ${req.filter} courses.`;
};

export function parseVoiceCommand(input: string, role: "student" | "teacher"): VoiceCommandResult {
  const text = normalise(input);
  if (!text) return { reply: "I didn't hear anything. Try again or type a command.", action: { type: "none" } };

  // Help
  if (/^help\b/.test(text) || /\b(what can you do|commands|what can i say)\b/.test(text)) {
    return {
      reply: "You can open any page, ask for a hint, filter courses, or switch between the student and teacher views.",
      action: { type: "help" },
    };
  }

  // Role toggle
  const toggle = text.match(/^toggle\s*:?\s*(\w+)/) || text.match(/\bswitch (?:to )?(?:the )?(teacher|student)\b/);
  if (toggle) {
    const target = toggle[1].startsWith("teach") ? "teacher" : toggle[1].startsWith("stud") ? "student" : null;
    if (!target) return { reply: "I can toggle between the teacher and student views. Say toggle:teacher or toggle:student.", action: { type: "none" } };
    if (target === role) return { reply: `You're already in the ${target} view.`, action: { type: "none" } };
    return { reply: `Switched to the ${target} view.`, action: { type: "role", role: target } };
  }

  // Hint
  if (/\b(hint|hints|stuck|clue)\b/.test(text)) {
    if (role === "teacher") return { reply: "Hints are part of the student diagnostic. Switch to the student view to use them.", action: { type: "none" } };
    return { reply: "Opening the diagnostic with your first hint shown.", action: { type: "hint" } };
  }

  // Course filter
  const filterMatch = text.match(/^filter\s*:?\s*(.*)$/) || text.match(/\b(?:class|grade)\s*\d{1,2}\b.*\bcourses?\b|\bcourses?\b.*\b(?:class|grade)\s*\d{1,2}\b/);
  if (filterMatch) {
    const raw = text.startsWith("filter") ? text.replace(/^filter\s*:?\s*/, "") : text;
    const request = parseCourseFilter(raw);
    return { reply: describeFilter(raw, request), action: { type: "filter", request } };
  }

  // Navigation: "nav:<page>" or natural phrasing
  const navTarget = text.startsWith("nav") ? text.replace(/^nav\s*:?\s*/, "") : text.replace(FILLER, " ").replace(/\s+/g, " ").trim();
  const page = findPage(navTarget, role) || findPage(text, role);
  if (page) return { reply: `Opening ${page.label}.`, action: { type: "navigate", hash: page.hash } };

  return { reply: `I heard "${input.trim()}" but didn't recognise a command. Say "help" to see what I can do.`, action: { type: "none" } };
}

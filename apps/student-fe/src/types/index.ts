export type ThemeMode = "normal" | "adhd" | "dyslexic";

export type AcademicTier = "School (K-12)" | "Undergraduate (UG)" | "Postgraduate (PG)" | "Professional";

export type AcademicDiscipline = 
  | "Mathematics"
  | "Computer Science"
  | "Medicine & Physiology"
  | "Commerce & Finance"
  | "Law & Humanities"
  | "Natural Sciences";

export type MisconceptionStatus = "Detected" | "Remediating" | "Re-Evaluating" | "Resolved";

export interface Course {
  id: string;
  title: string;
  grade: string;
  tier: AcademicTier;
  discipline: AcademicDiscipline;
  category: "Foundations" | "Core Curriculum" | "Advanced";
  duration: string;
  rating: number;
  enrolledStudents: number;
  prerequisites: string[];
  misconceptionRisk: "Low" | "Medium" | "High";
  description: string;
  instructor: {
    name: string;
    role: string;
    avatar: string;
  };
  modules: {
    title: string;
    duration: string;
    lessons: string[];
  }[];
}

export interface Instructor {
  id: string;
  name: string;
  credentials: string;
  role: string;
  specialization: string[];
  bio: string;
  rating: number;
  studentsTaught: number;
  avatar: string;
  availableHours: string;
}

export interface DiagnosticOption {
  id: string;
  label: string;
  isCorrect: boolean;
  misconceptionTitle?: string;
  errorRootCause?: string;
  prerequisiteGap?: string;
  explanation?: string;
}

export interface VerificationQuestion {
  question: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

export interface ScaffoldedHint {
  tier: 1 | 2 | 3;
  tierName: "Nudge" | "Scaffold" | "Structural Guidance";
  content: string;
}

export interface ConceptChallenge {
  id: string;
  tier: AcademicTier;
  discipline: AcademicDiscipline;
  topic: string;
  domain: string;
  gradeLevel: string;
  equationOrPrompt: string;
  instructions: string;
  options: DiagnosticOption[];
  verification: VerificationQuestion;
  hints: ScaffoldedHint[];
  microLesson: {
    title: string;
    ruleName: string;
    analogySummary: string;
    failurePoint: string;
    correctPath: string;
    voiceScript: string;
  };
}

export interface ConceptNode {
  id: string;
  label: string;
  category: "prerequisite" | "active" | "target";
  mastery: number;
  status: "mastered" | "active-struggle" | "locked";
  description: string;
  connections: string[];
}

export interface EducationalResource {
  id: string;
  title: string;
  source: string;
  type: "video" | "paper" | "simulation" | "cheatsheet";
  url: string;
  summary: string;
  tier: AcademicTier;
  discipline: AcademicDiscipline;
  matchedMisconception: string;
  durationOrPages: string;
  rating: number;
  bookmarked?: boolean;
}

export interface StudentMisconceptionRecord {
  id: string;
  conceptId: string;
  conceptName: string;
  discipline: AcademicDiscipline;
  identifiedMisconception: string;
  status: MisconceptionStatus;
  firstDetected: string;
  lastAttempt: string;
  attemptCount: number;
  resolutionTimestamp?: string;
  remedialInterventionTitle: string;
}

export interface StudentTelemetryProfile {
  id: string;
  name: string;
  avatar: string;
  cohort: string;
  tier: AcademicTier;
  discipline: AcademicDiscipline;
  masteryScore: number; // 0.0 to 1.0
  activeMisconceptions: string[];
  resolvedMisconceptionsCount: number;
  averageVelocitySec: number;
  hintRelianceIndex: number; // 0.0 to 1.0
  learningStyle: "Visual / Spatial" | "Auditory / Verbal" | "Kinesthetic / Experimental";
  primaryStumblingBlock: string;
  recentTrajectory: "Improving" | "Plateau" | "At-Risk";
  recommendedPeerMatch: string;
  attendancePct: number;
}

export interface RemedialPod {
  id: string;
  podName: string;
  sharedMisconception: string;
  conceptId: string;
  discipline: AcademicDiscipline;
  studentIds: string[];
  recommendedActivity: string;
  estimatedMinutes: number;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: "info" | "success" | "warning";
}

export type UserRole = "student" | "teacher";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  institution?: string;
  academicTier?: AcademicTier;
  department?: string;
  enrolledCourses?: string[];
  createdAt?: string;
  lastLogin?: string;
}

import { StudentTelemetryProfile, StudentMisconceptionRecord, RemedialPod } from "../types";

export const MOCK_STUDENT_PROFILES: StudentTelemetryProfile[] = [
  {
    id: "st-01",
    name: "Baseline Bob",
    avatar: "https://i.pravatar.cc/150?u=st-01",
    cohort: "Fall 2026 - CS101",
    tier: "Undergraduate (UG)",
    discipline: "Computer Science",
    masteryScore: 0.88,
    activeMisconceptions: [],
    resolvedMisconceptionsCount: 5,
    averageVelocitySec: 45,
    hintRelianceIndex: 0.1,
    learningStyle: "Auditory / Verbal",
    primaryStumblingBlock: "None",
    recentTrajectory: "Improving",
    recommendedPeerMatch: "st-04",
    attendancePct: 98
  },
  {
    id: "st-02",
    name: "Alex (ADHD Profile)",
    avatar: "https://i.pravatar.cc/150?u=st-02",
    cohort: "Fall 2026 - CS101",
    tier: "Undergraduate (UG)",
    discipline: "Computer Science",
    masteryScore: 0.72,
    activeMisconceptions: ["Misses edge cases in loop boundaries", "Ignores variable initialization"],
    resolvedMisconceptionsCount: 8,
    averageVelocitySec: 12,
    hintRelianceIndex: 0.8,
    learningStyle: "Kinesthetic / Experimental",
    primaryStumblingBlock: "Careless Errors / Rushing",
    recentTrajectory: "Plateau",
    recommendedPeerMatch: "st-01",
    attendancePct: 85
  },
  {
    id: "st-03",
    name: "Diana (Dyslexia Profile)",
    avatar: "https://i.pravatar.cc/150?u=st-03",
    cohort: "Fall 2026 - CS101",
    tier: "Undergraduate (UG)",
    discipline: "Computer Science",
    masteryScore: 0.65,
    activeMisconceptions: ["Confuses '=' with '=='", "Reverses array indices"],
    resolvedMisconceptionsCount: 3,
    averageVelocitySec: 120,
    hintRelianceIndex: 0.4,
    learningStyle: "Visual / Spatial",
    primaryStumblingBlock: "Syntax confusion / Symbol swapping",
    recentTrajectory: "Improving",
    recommendedPeerMatch: "st-01",
    attendancePct: 95
  },
  {
    id: "st-04",
    name: "Struggling Sam",
    avatar: "https://i.pravatar.cc/150?u=st-04",
    cohort: "Fall 2026 - CS101",
    tier: "Undergraduate (UG)",
    discipline: "Computer Science",
    masteryScore: 0.45,
    activeMisconceptions: ["Fundamental misunderstanding of recursion", "Cannot trace call stack", "Fails to identify base case"],
    resolvedMisconceptionsCount: 1,
    averageVelocitySec: 90,
    hintRelianceIndex: 0.9,
    learningStyle: "Kinesthetic / Experimental",
    primaryStumblingBlock: "Conceptual wall on Recursion",
    recentTrajectory: "At-Risk",
    recommendedPeerMatch: "st-01",
    attendancePct: 70
  }
];

export const MOCK_STUDENT_MISCONCEPTION_LOGS: StudentMisconceptionRecord[] = [];
export const MOCK_REMEDIAL_PODS: RemedialPod[] = [];

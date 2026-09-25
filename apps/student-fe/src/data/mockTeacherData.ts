export interface HeatmapItem {
  id: string;
  topic: string;
  misconception: string;
  affectedCount: number;
  totalStudents: number;
  severity: "critical" | "moderate" | "low";
  classGroup: string;
}

export interface AtRiskStudent {
  id: string;
  name: string;
  avatar: string;
  classGroup: string;
  stumblingBlock: string;
  consecutiveMissteps: number;
  masteryScore: number;
  lastAttemptTime: string;
}

export const MOCK_HEATMAP_DATA: HeatmapItem[] = [
  {
    id: "hm-1",
    topic: "Linear Equations",
    misconception: "Sign Inversion Error on Negative Factors",
    affectedCount: 14,
    totalStudents: 32,
    severity: "critical",
    classGroup: "Grade 9-B",
  },
  {
    id: "hm-2",
    topic: "Distributive Law",
    misconception: "Omission of Multiplier on Constant Terms",
    affectedCount: 9,
    totalStudents: 32,
    severity: "moderate",
    classGroup: "Grade 9-B",
  },
  {
    id: "hm-3",
    topic: "Polynomials",
    misconception: "Confusing (a + b)² with a² + b²",
    affectedCount: 18,
    totalStudents: 30,
    severity: "critical",
    classGroup: "Grade 10-Alpha",
  },
  {
    id: "hm-4",
    topic: "Coordinate Geometry",
    misconception: "Reversing Abscissa and Ordinate (x, y)",
    affectedCount: 6,
    totalStudents: 28,
    severity: "low",
    classGroup: "Grade 8-A",
  },
  {
    id: "hm-5",
    topic: "Linear Equations",
    misconception: "Dividing only the variable instead of all terms",
    affectedCount: 11,
    totalStudents: 32,
    severity: "moderate",
    classGroup: "Grade 9-B",
  },
];

export const MOCK_AT_RISK_STUDENTS: AtRiskStudent[] = [
  {
    id: "st-aarav",
    name: "Aarav Mehta",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    classGroup: "Grade 9-B",
    stumblingBlock: "Negative Multiplication Sign Inversions",
    consecutiveMissteps: 3,
    masteryScore: 0.38,
    lastAttemptTime: "12 mins ago",
  },
  {
    id: "st-diya",
    name: "Diya Roy",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    classGroup: "Grade 9-B",
    stumblingBlock: "Equation Balance Subtraction Asymmetry",
    consecutiveMissteps: 4,
    masteryScore: 0.42,
    lastAttemptTime: "25 mins ago",
  },
  {
    id: "st-rohan",
    name: "Rohan Kapoor",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
    classGroup: "Grade 10-Alpha",
    stumblingBlock: "Quadratic Discriminant Negative Square Root",
    consecutiveMissteps: 3,
    masteryScore: 0.45,
    lastAttemptTime: "40 mins ago",
  },
];

export const MOCK_INTERVENTION_PLANS = [
  {
    title: "5-Minute Opening Whiteboard Warmup: The Debt Multiplier",
    estimatedMinutes: 5,
    targetConcept: "Multiplying Negative Integers Across Parentheses",
    actionPlan: [
      "Present 2 real-life balances: Debt of $9 removed twice = +$18 cash.",
      "Ask students to circle the sign of each term BEFORE expanding parentheses.",
      "Conduct a 3-question rapid thumb-voting diagnostic.",
    ],
  },
];

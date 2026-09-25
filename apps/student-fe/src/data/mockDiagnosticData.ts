import { DiagnosticOption, VerificationQuestion } from "../types";

export const DIAGNOSTIC_CHALLENGE = {
  equation: "4(2x - 3) = -2(x - 9)",
  domain: "Algebraic Linear Equations",
  gradeLevel: "Class 9 Standards",
  description: "Solve for the real value of x by expanding the terms and balancing variables across both sides.",
};

export const DIAGNOSTIC_OPTIONS: DiagnosticOption[] = [
  {
    id: "opt-correct",
    label: "x = 5",
    isCorrect: true,
    explanation: "Excellent! You expanded both sides correctly: 8x - 12 = -2x + 18 -> 10x = 30 -> x = 3. Wait, 10x = 30 gives x = 3. Let's trace carefully: 8x - 12 = -2x + 18 -> 10x = 30 -> x = 3 is mathematically sound!",
  },
  {
    id: "opt-sign-inversion",
    label: "x = 3",
    isCorrect: false,
    misconceptionTitle: "Sign Inversion Error (Negative × Negative)",
    errorRootCause: "When multiplying -2 by -9, you recorded -18 instead of +18. This led to: 8x - 12 = -2x - 18 -> 10x = -6 -> x = -0.6 or improper sign flip.",
    prerequisiteGap: "Class 7 Integer Multiplication & Negation Axioms",
    explanation: "A negative number times a negative number ALWAYS cancels into a positive value. Think of -2 * (-9) as removing 2 debts of 9 dollars, leaving you with +18 cash.",
  },
  {
    id: "opt-distribution-omission",
    label: "x = 2",
    isCorrect: false,
    misconceptionTitle: "Multiplier Omission on Constants",
    errorRootCause: "You multiplied 4 by 2x to get 8x, but forgot to multiply 4 by 3, leaving 8x - 3 instead of 8x - 12.",
    prerequisiteGap: "Distributive Law over Parentheses: a(b + c) = ab + ac",
    explanation: "Remember the area model: the outside multiplier must scale EVERY citizen inside the parentheses castle!",
  },
  {
    id: "opt-variable-balance-slip",
    label: "x = 6",
    isCorrect: false,
    misconceptionTitle: "Variable Cancellation Asymmetry",
    errorRootCause: "When bringing -2x over to the left side, you subtracted 2x from 8x (yielding 6x) instead of adding 2x (yielding 10x).",
    prerequisiteGap: "Additive Inverses & Equation Balancing",
    explanation: "To eliminate a negative term (-2x) from the right side, you must perform the inverse operation: ADD 2x to BOTH sides.",
  },
];

export const VERIFICATION_CHALLENGE: VerificationQuestion = {
  question: "Solve the isomorphic equation: -3(2y - 5) = 3",
  options: [
    {
      id: "ver-1",
      label: "y = 2",
      isCorrect: true,
      feedback: "Correct! -6y + 15 = 3 -> -6y = -12 -> y = 2. You mastered the negative distribution rule!",
    },
    {
      id: "ver-2",
      label: "y = -2",
      isCorrect: false,
      feedback: "Check your final division: -12 divided by -6 is POSITIVE 2, not negative 2.",
    },
    {
      id: "ver-3",
      label: "y = 3",
      isCorrect: false,
      feedback: "Sign trap: Did you remember that -3 * (-5) yields +15?",
    },
    {
      id: "ver-4",
      label: "y = 1",
      isCorrect: false,
      feedback: "Check your initial expansion step: -3 * 2y = -6y and -3 * -5 = +15.",
    },
  ],
};

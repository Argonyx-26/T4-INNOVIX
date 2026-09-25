import { ConceptChallenge } from "../types";

export const UNIVERSAL_CHALLENGES: ConceptChallenge[] = [
  {
    id: "math-school-linear",
    tier: "School (K-12)",
    discipline: "Mathematics",
    topic: "Linear Equation Expansion",
    domain: "Algebraic Reasoning & Sign Axioms",
    gradeLevel: "Class 9 Standards",
    equationOrPrompt: "-2(x - 9) = 14",
    instructions: "Solve for x by expanding the terms and isolating the variable.",
    options: [
      {
        id: "math-opt-1",
        label: "x = 3.5",
        isCorrect: false,
        misconceptionTitle: "Negative Factor Distribution Inversion",
        errorRootCause: "Multiplied -2 by -9 as -18 instead of +18, recording -2x - 18 = 14 -> -2x = 32 or x = 3.5.",
        prerequisiteGap: "Negative Integer Multiplication: (-a) × (-b) = +ab",
        explanation: "Canceling a debt twice creates positive asset: -2 × (-9) = +18, never -18."
      },
      {
        id: "math-opt-2",
        label: "x = 2",
        isCorrect: true,
        misconceptionTitle: "",
        explanation: "Correct! -2x + 18 = 14 -> -2x = -4 -> x = 2."
      },
      {
        id: "math-opt-3",
        label: "x = -1",
        isCorrect: false,
        misconceptionTitle: "Subtracted Constant Inversion",
        errorRootCause: "Subtracted 18 improperly or inverted variable transposition signs.",
        prerequisiteGap: "Additive Inverse Properties",
        explanation: "Subtracting 18 from 14 gives -4. Then divide by -2 to get positive 2."
      },
      {
        id: "math-opt-4",
        label: "x = 5",
        isCorrect: false,
        misconceptionTitle: "Division by Negative Omission",
        errorRootCause: "Dropped negative sign during the final division step.",
        prerequisiteGap: "Signed Quotient Axioms",
        explanation: "When dividing negative by negative, the result is positive."
      }
    ],
    verification: {
      question: "Verify isomorphic transfer: Solve -3(2y - 5) = 3",
      options: [
        { id: "ver-math-1", label: "y = 2", isCorrect: true, feedback: "Spot on! -6y + 15 = 3 -> -6y = -12 -> y = 2." },
        { id: "ver-math-2", label: "y = -2", isCorrect: false, feedback: "Sign trap: -12 divided by -6 is +2." },
        { id: "ver-math-3", label: "y = 1", isCorrect: false, feedback: "Check your initial expansion: -3 * (-5) = +15." },
        { id: "ver-math-4", label: "y = 3", isCorrect: false, feedback: "Arithmetic calculation mismatch in step 2." },
      ]
    },
    hints: [
      {
        tier: 1,
        tierName: "Nudge",
        content: "Notice the factor outside the parentheses is negative (-2). What happens when multiplying negative times negative?"
      },
      {
        tier: 2,
        tierName: "Scaffold",
        content: "Split the expansion into two steps: (-2) × (x) = -2x, and (-2) × (-9) = ? Remember that subtracting negative 9 is identical to adding."
      },
      {
        tier: 3,
        tierName: "Structural Guidance",
        content: "-2(x - 9) expands to -2x + 18. The equation becomes -2x + 18 = 14. Subtract 18 from both sides, then divide by -2."
      }
    ],
    microLesson: {
      title: "The Debt Cancellation Rule",
      ruleName: "(-a) × (-b) = +ab",
      analogySummary: "If you remove 2 debts of 9 dollars, your net wealth increases by 18 dollars in positive cash.",
      failurePoint: "-2 × (-9) = -18 (Common Sign Inversion Trap)",
      correctPath: "-2 × (-9) = +18 -> -2x + 18 = 14",
      voiceScript: "In algebra, multiplying negative two by negative nine yields positive eighteen. Removing two debts of nine dollars leaves you with eighteen dollars in positive balance."
    }
  },
  {
    id: "cs-ug-binary-search",
    tier: "Undergraduate (UG)",
    discipline: "Computer Science",
    topic: "Binary Search Boundary Conditions",
    domain: "Algorithms & Asymptotic Correctness",
    gradeLevel: "B.Tech Computer Science Core",
    equationOrPrompt: "while (low <= high) { int mid = low + (high - low) / 2;\n  if (arr[mid] > target) high = mid;\n  else if (arr[mid] < target) low = mid + 1;\n  else return mid;\n}",
    instructions: "Identify the critical flaw in the pointer boundary update statement.",
    options: [
      {
        id: "cs-opt-1",
        label: "Infinite Loop on 2-Element Subarray: high = mid should be high = mid - 1",
        isCorrect: true,
        misconceptionTitle: "",
        explanation: "Correct! If arr[mid] > target, mid has already been evaluated and rejected. Assigning high = mid fails to shrink the search space when low + 1 == high, causing an infinite loop."
      },
      {
        id: "cs-opt-2",
        label: "Mid calculation overflow: low + (high - low)/2 is invalid",
        isCorrect: false,
        misconceptionTitle: "Integer Arithmetic Precision Misunderstanding",
        errorRootCause: "Believing low + (high - low)/2 is an error, when it is the canonical overflow prevention formula.",
        prerequisiteGap: "32-bit Signed Integer Range & Bitwise Rounding",
        explanation: "low + (high - low)/2 prevents integer overflow that occurs with (low + high)/2."
      },
      {
        id: "cs-opt-3",
        label: "Loop guard error: while (low <= high) causes out-of-bounds index",
        isCorrect: false,
        misconceptionTitle: "Search Space Invariant Confusion",
        errorRootCause: "Confusing inclusive [low, high] search bounds with half-open intervals [low, high).",
        prerequisiteGap: "Loop Invariants & Interval Topology",
        explanation: "When using high = n - 1, the interval is inclusive, so low <= high is strictly necessary to examine 1-element arrays."
      },
      {
        id: "cs-opt-4",
        label: "Mid condition flaw: else if (arr[mid] < target) should be low = mid",
        isCorrect: false,
        misconceptionTitle: "Directional Asymmetry Inversion",
        errorRootCause: "Introducing a matching infinite loop on the lower boundary.",
        prerequisiteGap: "Strictly Monotonic Index Partitioning",
        explanation: "low = mid + 1 is correct because arr[mid] is strictly smaller than the target."
      }
    ],
    verification: {
      question: "Verify loop termination on array [4, 8] with target = 2: What happens if high = mid is used?",
      options: [
        { id: "ver-cs-1", label: "Infinite loop: mid stays 0, high stays 0, loop never terminates", isCorrect: true, feedback: "Correct! mid = 0, arr[0]=4 > 2 -> high = 0. Next iteration mid = 0 again." },
        { id: "ver-cs-2", label: "Throws ArrayIndexOutOfBoundsException immediately", isCorrect: false, feedback: "Indices stay within bounds 0..1, but the loop never halts." },
        { id: "ver-cs-3", label: "Returns index 0 incorrectly", isCorrect: false, feedback: "It never reaches the return statement." },
        { id: "ver-cs-4", label: "Terminates normally in 2 steps", isCorrect: false, feedback: "Test with pencil and paper: low=0, high=0 creates an infinite cycle." }
      ]
    },
    hints: [
      {
        tier: 1,
        tierName: "Nudge",
        content: "Look at what happens to the size of the search interval [low, high] when only 2 elements remain."
      },
      {
        tier: 2,
        tierName: "Scaffold",
        content: "Notice that arr[mid] was already checked with 'if (arr[mid] > target)'. Is there any reason to keep index 'mid' in the search window?"
      },
      {
        tier: 3,
        tierName: "Structural Guidance",
        content: "Because arr[mid] cannot be the target, the new upper bound must be strictly to the left of mid: high = mid - 1. Otherwise, integer division causes high to equal mid repeatedly."
      }
    ],
    microLesson: {
      title: "The Invariant Shrinking Rule",
      ruleName: "Every iteration MUST strictly reduce (high - low + 1)",
      analogySummary: "If you eliminate a book from a suspect pile, you take it off the stack; you don't leave it as the top boundary of the remaining stack.",
      failurePoint: "high = mid (Keeps rejected index in window -> Infinite Loop)",
      correctPath: "high = mid - 1 (Guarantees window reduction)",
      voiceScript: "In binary search, once an element is checked and found strictly greater than target, you must exclude it completely by setting high to mid minus one."
    }
  },
  {
    id: "med-ug-action-potential",
    tier: "Undergraduate (UG)",
    discipline: "Medicine & Physiology",
    topic: "Cardiac Action Potential Electrophysiology",
    domain: "Cellular Neurobiology & Membrane Biomechanics",
    gradeLevel: "MBBS / Pre-Med Stage 1",
    equationOrPrompt: "During Phase 3 repolarization of ventricular cardiac myocytes, rapid restoration of the resting membrane potential (-90 mV) is primarily driven by:",
    instructions: "Select the specific ion channel flux responsible for Phase 3 repolarization.",
    options: [
      {
        id: "med-opt-1",
        label: "Rapid Efflux of Potassium (K+) ions through delayed rectifier channels",
        isCorrect: true,
        misconceptionTitle: "",
        explanation: "Correct! Phase 3 rapid repolarization is mediated by delayed rectifier potassium channels (IKr and IKs) allowing K+ efflux down its electrochemical gradient while L-type Ca2+ channels close."
      },
      {
        id: "med-opt-2",
        label: "Massive Influx of Calcium (Ca2+) ions into the sarcoplasm",
        isCorrect: false,
        misconceptionTitle: "Phase 2 Plateau Confusion with Phase 3 Repolarization",
        errorRootCause: "Confusing the plateau phase (Phase 2, where inward Ca2+ balances outward K+) with terminal repolarization (Phase 3).",
        prerequisiteGap: "Cardiac Action Potential Phase Chronology (0 to 4)",
        explanation: "Ca2+ influx maintains the prolonged plateau of Phase 2. Closure of Ca2+ channels is required for Phase 3 repolarization to proceed."
      },
      {
        id: "med-opt-3",
        label: "Rapid Influx of Sodium (Na+) ions via voltage-gated Nav1.5 channels",
        isCorrect: false,
        misconceptionTitle: "Phase 0 Depolarization Inversion",
        errorRootCause: "Attributing rapid depolarization mechanisms (Phase 0) to repolarization.",
        prerequisiteGap: "Nernst Equilibrium Potentials for Na+ (+65mV) vs K+ (-96mV)",
        explanation: "Na+ influx causes rapid depolarization toward +20 mV (Phase 0), not repolarization toward -90 mV."
      },
      {
        id: "med-opt-4",
        label: "Direct Active Transport by the Na+/K+ ATPase pump alone",
        isCorrect: false,
        misconceptionTitle: "Passive Channel Conductance vs Active Pump Kinetic Gap",
        errorRootCause: "Believing the electrogenic Na+/K+ pump mediates rapid millisecond repolarization.",
        prerequisiteGap: "Ion Channel High Flux Kinetics vs Enzymatic Pump Turnover Rates",
        explanation: "The Na+/K+ ATPase pump maintains long-term baseline gradients (Phase 4), but is far too slow to drive rapid millisecond Phase 3 repolarization, which requires passive channel flux."
      }
    ],
    verification: {
      question: "If a pharmacological agent selectively blocks IKr (delayed rectifier K+ channels), what happens to the ECG?",
      options: [
        { id: "ver-med-1", label: "Prolonged QT Interval with risk of Torsades de Pointes", isCorrect: true, feedback: "Correct! Delayed repolarization prolongs the QT interval on surface electrocardiograms." },
        { id: "ver-med-2", label: "Shortened PR interval with delta waves", isCorrect: false, feedback: "PR interval relates to AV nodal conduction, not ventricular repolarization." },
        { id: "ver-med-3", label: "Widened QRS with ST elevation", isCorrect: false, feedback: "QRS width reflects Phase 0 intraventricular conduction velocity." },
        { id: "ver-med-4", label: "Immediate cessation of SA nodal pacemaker discharge", isCorrect: false, feedback: "SA node action potential depends on Funny channels (If) and T-type Ca2+." }
      ]
    },
    hints: [
      {
        tier: 1,
        tierName: "Nudge",
        content: "To make the inside of the cell negative (-90 mV), you need either positive ions leaving the cell or negative ions entering."
      },
      {
        tier: 2,
        tierName: "Scaffold",
        content: "Potassium (K+) concentration is high inside (140 mM) and low outside (4 mM). Opening K+ channels causes rapid outward diffusion."
      },
      {
        tier: 3,
        tierName: "Structural Guidance",
        content: "Phase 3 is defined by L-type calcium channel inactivation combined with opening of delayed rectifier potassium channels (IKr/IKs), causing rapid positive charge efflux."
      }
    ],
    microLesson: {
      title: "The Electrochemical Outflow Rule",
      ruleName: "Outward Cation Flux drives Negative Repolarization",
      analogySummary: "Think of the myocyte as a charged capacitor: opening potassium gates lets positive ions escape, quickly returning the interior to negative rest.",
      failurePoint: "Confusing Ca2+ plateau sustainment with K+ repolarization efflux",
      correctPath: "Phase 3 = Ca2+ channels close + Delayed Rectifier K+ channels open -> K+ efflux -> -90mV",
      voiceScript: "Ventricular repolarization in Phase three requires positive potassium ions to rapidly leave the cell through delayed rectifier channels, pulling the membrane potential back to negative ninety millivolts."
    }
  },
  {
    id: "fin-ug-accruals",
    tier: "Postgraduate (PG)",
    discipline: "Commerce & Finance",
    topic: "Working Capital & Cash Flow Statement Synthesis",
    domain: "Corporate Financial Analysis & Accrual Accounting",
    gradeLevel: "MBA / CFA Level 1",
    equationOrPrompt: "An enterprise reports Net Income of $500,000. During the year, Accounts Receivable increases by $80,000 and Accounts Payable decreases by $30,000. Assuming no other adjustments, what is the Cash Flow from Operations (CFO)?",
    instructions: "Compute the indirect cash flow from operations adjusting for working capital shifts.",
    options: [
      {
        id: "fin-opt-1",
        label: "$390,000 (Subtract both AR increase and AP decrease)",
        isCorrect: true,
        misconceptionTitle: "",
        explanation: "Correct! Increase in Accounts Receivable represents earned revenue not yet collected in cash (-$80k). Decrease in Accounts Payable represents paying off previous obligations (-$30k). CFO = $500k - $80k - $30k = $390,000."
      },
      {
        id: "fin-opt-2",
        label: "$610,000 (Add both AR increase and AP decrease)",
        isCorrect: false,
        misconceptionTitle: "Asset & Liability Working Capital Direction Inversion",
        errorRootCause: "Adding asset increases as if they were cash receipts, rather than uncollected revenue.",
        prerequisiteGap: "Indirect Cash Flow Statement Adjustment Conventions",
        explanation: "When Accounts Receivable increases, customers owe you money that is recognized in Net Income but has not arrived in cash. You must SUBTRACT the increase."
      },
      {
        id: "fin-opt-3",
        label: "$450,000 (Subtract AR increase, add AP decrease)",
        isCorrect: false,
        misconceptionTitle: "Liability Settlement Cash Outflow Omission",
        errorRootCause: "Treating a decrease in liabilities as a cash inflow rather than cash paid to suppliers.",
        prerequisiteGap: "Working Capital Cash Flux: dLiabilities < 0 requires Cash Outflow",
        explanation: "Paying down accounts payable consumes real cash. Therefore, a decrease in AP must be subtracted from Net Income."
      },
      {
        id: "fin-opt-4",
        label: "$550,000 (Add AR increase, subtract AP decrease)",
        isCorrect: false,
        misconceptionTitle: "Accrued Revenue Cash Timing Fallacy",
        errorRootCause: "Treating paper revenue expansion as cash inflow.",
        prerequisiteGap: "Accrual Recognition vs Cash Realization",
        explanation: "AR increase means revenue was booked before cash was received. It must be subtracted."
      }
    ],
    verification: {
      question: "If Inventory increases by $25,000 during the fiscal quarter, how is it adjusted in CFO?",
      options: [
        { id: "ver-fin-1", label: "Deducted (-$25,000) because cash was spent to purchase inventory", isCorrect: true, feedback: "Correct! Purchasing inventory drains cash before the goods are sold." },
        { id: "ver-fin-2", label: "Added (+$25,000) because assets grew", isCorrect: false, feedback: "Asset growth requires cash outlay, reducing liquidity." },
        { id: "ver-fin-3", label: "No adjustment, inventory is purely a balance sheet item", isCorrect: false, feedback: "Operating working capital changes directly adjust Net Income to calculate CFO." },
        { id: "ver-fin-4", label: "Reported under Cash Flow from Financing", isCorrect: false, feedback: "Inventory is an operating asset, not financing." }
      ]
    },
    hints: [
      {
        tier: 1,
        tierName: "Nudge",
        content: "Remember the rule of thumb: An increase in a Current Asset consumes cash; an increase in a Current Liability provides cash."
      },
      {
        tier: 2,
        tierName: "Scaffold",
        content: "Net Income includes $80,000 of sales where cash has not been collected yet. Did that cash actually enter the bank account?"
      },
      {
        tier: 3,
        tierName: "Structural Guidance",
        content: "Formula: CFO = Net Income - (Increase in Operating Assets) + (Increase in Operating Liabilities). So: $500,000 - $80,000 (AR) - $30,000 (AP) = $390,000."
      }
    ],
    microLesson: {
      title: "The Working Capital Cash Conversion Rule",
      ruleName: "dAssets Consume Cash (-) | dLiabilities Release Cash (+)",
      analogySummary: "If you sell lemonade and the customer gives you an IOU note instead of coins, your paper profit goes up, but your cash drawer has not received a dime.",
      failurePoint: "Adding Accounts Receivable increase as cash received",
      correctPath: "Net Income - AR Increase ($80k) - AP Decrease ($30k) = $390,000",
      voiceScript: "In accrual accounting, increases in accounts receivable represent sales made on credit where cash has not yet arrived. They must always be subtracted from net income to determine real cash from operations."
    }
  }
];

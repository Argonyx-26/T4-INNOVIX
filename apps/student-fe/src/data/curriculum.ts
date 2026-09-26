import { AcademicDiscipline, AcademicTier } from "../types";

export interface CurriculumTopic {
  id: string;
  subject: AcademicDiscipline;
  name: string;
  tier: AcademicTier;
  summary: string;
  // Other names the same topic appears under (diagnostic questions, AI test topics).
  aliases?: string[];
}

export const SUBJECTS: AcademicDiscipline[] = [
  "Mathematics",
  "Computer Science",
  "Natural Sciences",
  "Commerce & Finance",
  "Medicine & Physiology",
  "Law & Humanities",
];

const t = (
  subject: AcademicDiscipline,
  id: string,
  name: string,
  tier: AcademicTier,
  summary: string,
  aliases: string[] = []
): CurriculumTopic => ({ id, subject, name, tier, summary, aliases });

export const CURRICULUM: CurriculumTopic[] = [
  t("Mathematics", "fractions-decimals", "Fractions & Decimals", "School (K-12)", "Comparing, converting and operating on fractions and decimals.", ["comparing decimals", "fractions and decimals"]),
  t("Mathematics", "linear-equations", "Linear Equations", "School (K-12)", "Solving equations, distributing negatives, balancing both sides.", ["distributing a negative factor", "linear equations"]),
  t("Mathematics", "probability", "Probability", "School (K-12)", "Independent events, AND/OR rules, expected outcomes.", ["independent events", "probability"]),
  t("Mathematics", "quadratic-equations", "Quadratic Equations", "School (K-12)", "Factoring, the quadratic formula and the discriminant."),
  t("Mathematics", "derivatives", "Derivatives", "Undergraduate (UG)", "Rates of change, the chain rule and optimisation.", ["calculus", "differentiation"]),
  t("Mathematics", "statistics-inference", "Statistical Inference", "Undergraduate (UG)", "Sampling, confidence intervals and hypothesis tests."),

  t("Computer Science", "binary-search", "Binary Search", "Undergraduate (UG)", "Loop invariants, boundaries and termination.", ["binary search loop termination", "binary search termination"]),
  t("Computer Science", "recursion", "Recursion", "Undergraduate (UG)", "Base cases, the call stack and recursive thinking."),
  t("Computer Science", "big-o", "Time Complexity (Big-O)", "Undergraduate (UG)", "Counting operations and comparing growth rates.", ["big o", "complexity"]),
  t("Computer Science", "stacks-queues", "Stacks & Queues", "Undergraduate (UG)", "LIFO vs FIFO and choosing the right structure."),
  t("Computer Science", "sql-joins", "SQL Joins", "Undergraduate (UG)", "Inner, outer and self joins, and NULL behaviour."),
  t("Computer Science", "oop-basics", "Object-Oriented Programming", "Undergraduate (UG)", "Classes, inheritance, polymorphism and encapsulation.", ["oop"]),

  t("Natural Sciences", "newtons-laws", "Newton's Laws of Motion", "School (K-12)", "Inertia, F = ma and action–reaction pairs.", ["newton's first law", "newtons laws"]),
  t("Natural Sciences", "ohms-law", "Electricity & Ohm's Law", "School (K-12)", "Current, voltage, resistance and circuits.", ["electricity"]),
  t("Natural Sciences", "chemical-bonding", "Chemical Bonding", "School (K-12)", "Ionic, covalent and metallic bonds."),
  t("Natural Sciences", "photosynthesis", "Photosynthesis", "School (K-12)", "Light and dark reactions, inputs and outputs."),
  t("Natural Sciences", "cell-division", "Cell Division", "School (K-12)", "Mitosis vs meiosis and why each happens.", ["mitosis", "meiosis"]),
  t("Natural Sciences", "thermodynamics", "Thermodynamics", "Undergraduate (UG)", "Energy, entropy and the laws of thermodynamics."),

  t("Commerce & Finance", "debits-credits", "Debits & Credits", "Undergraduate (UG)", "Double-entry bookkeeping and the accounting equation.", ["debits and credits"]),
  t("Commerce & Finance", "time-value-money", "Time Value of Money", "Undergraduate (UG)", "Present value, future value and discounting."),
  t("Commerce & Finance", "financial-ratios", "Financial Ratios", "Undergraduate (UG)", "Liquidity, profitability and leverage ratios."),
  t("Commerce & Finance", "supply-demand", "Supply & Demand", "School (K-12)", "Equilibrium, shifts vs movements along a curve."),
  t("Commerce & Finance", "depreciation", "Depreciation", "Undergraduate (UG)", "Straight-line and declining-balance methods."),
  t("Commerce & Finance", "portfolio-risk", "Portfolio Risk & Return", "Postgraduate (PG)", "Diversification, beta and the CAPM."),

  t("Medicine & Physiology", "cardiac-action-potential", "Cardiac Action Potential", "Undergraduate (UG)", "Ion channels and the phases of the cardiac cycle.", ["cardiac action potential"]),
  t("Medicine & Physiology", "renal-physiology", "Renal Physiology", "Undergraduate (UG)", "Filtration, reabsorption and the nephron."),
  t("Medicine & Physiology", "acid-base", "Acid–Base Balance", "Undergraduate (UG)", "Buffers, compensation and blood-gas interpretation."),
  t("Medicine & Physiology", "respiratory-physiology", "Respiratory Physiology", "Undergraduate (UG)", "Ventilation, gas exchange and the O₂ dissociation curve."),
  t("Medicine & Physiology", "pharmacokinetics", "Pharmacokinetics", "Postgraduate (PG)", "Absorption, distribution, half-life and clearance."),
  t("Medicine & Physiology", "immunology-basics", "Immunology Basics", "Undergraduate (UG)", "Innate vs adaptive immunity, antibodies and T cells."),

  t("Law & Humanities", "fundamental-rights", "Fundamental Rights", "Undergraduate (UG)", "Articles 12–35 and when rights can be restricted.", ["fundamental rights"]),
  t("Law & Humanities", "separation-of-powers", "Separation of Powers", "Undergraduate (UG)", "Legislature, executive, judiciary and checks and balances."),
  t("Law & Humanities", "contract-law", "Contract Law Essentials", "Undergraduate (UG)", "Offer, acceptance, consideration and void contracts."),
  t("Law & Humanities", "torts-negligence", "Torts: Negligence", "Undergraduate (UG)", "Duty of care, breach, causation and damage."),
  t("Law & Humanities", "constitutional-amendments", "Constitutional Amendments", "Undergraduate (UG)", "Amendment procedure and the basic structure doctrine."),
  t("Law & Humanities", "evidence-law", "Law of Evidence", "Postgraduate (PG)", "Relevance, admissibility and burden of proof."),
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const topicById = (id: string) => CURRICULUM.find((c) => c.id === id);

/** Maps any topic name (catalog, alias, or free text) to a stable topic id. */
export const resolveTopic = (name: string, subject?: string): { id: string; name: string; subject: string } => {
  const n = norm(name);
  const hit =
    CURRICULUM.find((c) => c.id === name) ||
    CURRICULUM.find((c) => norm(c.name) === n || c.aliases?.some((a) => norm(a) === n)) ||
    CURRICULUM.find((c) => (!subject || c.subject === subject) && (n.includes(norm(c.name)) || c.aliases?.some((a) => n.includes(norm(a)))));
  if (hit) return { id: hit.id, name: hit.name, subject: hit.subject };
  return { id: `custom:${n.replace(/ /g, "-").slice(0, 60)}`, name: name.trim(), subject: subject || "Natural Sciences" };
};

import { EducationalResource } from "../types";

export const MOCK_EDUCATIONAL_RESOURCES: EducationalResource[] = [
  // Mathematics
  {
    id: "res-math-1",
    title: "Single Variable Calculus & Limits Integration",
    source: "MIT OpenCourseWare",
    type: "video",
    url: "https://ocw.mit.edu/courses/mathematics/18-01sc-single-variable-calculus-fall-2010/",
    summary: "Comprehensive MIT video lectures covering limit definitions, derivative fundamentals, and integration techniques to resolve foundational calculus gaps.",
    tier: "Undergraduate (UG)",
    discipline: "Mathematics",
    matchedMisconception: "Calculus Limits & Sign Evaluation Errors",
    durationOrPages: "45 mins",
    rating: 4.95
  },
  {
    id: "res-math-2",
    title: "Linear Algebra & Matrix Transformations Visualized",
    source: "3Blue1Brown & Khan Academy",
    type: "cheatsheet",
    url: "https://www.3blue1brown.com/topics/linear-algebra",
    summary: "Geometric intuition cheatsheet and vector transformation visual guide for eigenvalues, matrix multiplication, and span.",
    tier: "Undergraduate (UG)",
    discipline: "Mathematics",
    matchedMisconception: "Matrix Multiplication & Basis Vector Gaps",
    durationOrPages: "4 pages",
    rating: 4.98
  },
  {
    id: "res-math-3",
    title: "Interactive Vector Calculus & Field Lines Simulator",
    source: "PhET Interactive Simulations",
    type: "simulation",
    url: "https://phet.colorado.edu/en/simulations/charges-and-fields",
    summary: "Interactive vector field simulation allowing real-time exploration of gradient, divergence, curl, and flux density.",
    tier: "Undergraduate (UG)",
    discipline: "Mathematics",
    matchedMisconception: "Vector Direction & Gradient Intuition",
    durationOrPages: "Interactive Sim",
    rating: 4.92
  },
  {
    id: "res-math-4",
    title: "Differential Equations & Boundary Value Solutions",
    source: "arXiv Applied Math",
    type: "paper",
    url: "https://arxiv.org/abs/math/0503001",
    summary: "Rigorous academic review on analytical and numerical solution methods for second-order partial differential equations.",
    tier: "Postgraduate (PG)",
    discipline: "Mathematics",
    matchedMisconception: "Boundary Condition Application Errors",
    durationOrPages: "12 pages",
    rating: 4.88
  },

  // Computer Science
  {
    id: "res-cs-1",
    title: "Data Structures & Algorithm Complexity (Big-O)",
    source: "DevDocs & Stanford CS106B",
    type: "cheatsheet",
    url: "https://devdocs.io/",
    summary: "Complete reference sheet detailing time and space complexity for trees, graphs, heaps, hash maps, and sorting algorithms.",
    tier: "Undergraduate (UG)",
    discipline: "Computer Science",
    matchedMisconception: "Time Complexity & Loop Analysis Gaps",
    durationOrPages: "3 pages",
    rating: 4.96
  },
  {
    id: "res-cs-2",
    title: "Interactive Binary Tree & Graph Algorithm Visualizer",
    source: "VisuAlgo",
    type: "simulation",
    url: "https://visualgo.net/en",
    summary: "Step-by-step visual interactive sandbox for Dijkstra's algorithm, BFS, DFS, AVL tree rotations, and dynamic programming tables.",
    tier: "Undergraduate (UG)",
    discipline: "Computer Science",
    matchedMisconception: "Recursion & Pointer Dereferencing Traps",
    durationOrPages: "Interactive Sim",
    rating: 4.97
  },
  {
    id: "res-cs-3",
    title: "Deep Learning & Neural Network Backpropagation Calculus",
    source: "Stanford CS231n / Coursera",
    type: "paper",
    url: "https://cs231n.github.io/optimization-2/",
    summary: "Technical breakdown of computational graphs, chain rule gradient propagation, and optimization momentum algorithms.",
    tier: "Postgraduate (PG)",
    discipline: "Computer Science",
    matchedMisconception: "Gradient Vanishing & Chain Rule Matrix Missteps",
    durationOrPages: "16 pages",
    rating: 4.94
  },
  {
    id: "res-cs-4",
    title: "Operating Systems: Concurrency, Locks & Deadlocks",
    source: "UC Berkeley CS162",
    type: "video",
    url: "https://cs162.org/",
    summary: "In-depth video lecture series explaining semaphores, mutex locks, thread synchronization, and race condition prevention.",
    tier: "Undergraduate (UG)",
    discipline: "Computer Science",
    matchedMisconception: "Race Condition & Thread Locking Confusion",
    durationOrPages: "50 mins",
    rating: 4.91
  },

  // Natural Sciences & Physics
  {
    id: "res-sci-1",
    title: "Quantum Mechanics & Wave Function Collapse Simulator",
    source: "PhET Physics",
    type: "simulation",
    url: "https://phet.colorado.edu/en/simulations/quantum-bound-states",
    summary: "Interactive quantum physics simulation demonstrating potential wells, tunneling probability, and wave function probability densities.",
    tier: "Undergraduate (UG)",
    discipline: "Natural Sciences",
    matchedMisconception: "Quantum Superposition & Wave State Errors",
    durationOrPages: "Interactive Sim",
    rating: 4.93
  },
  {
    id: "res-sci-2",
    title: "Thermodynamics & Statistical Entropy Foundations",
    source: "Physical Review & MIT Physics",
    type: "paper",
    url: "https://ocw.mit.edu/courses/physics/8-044-statistical-physics-i-spring-2013/",
    summary: "Peer-reviewed analysis of microcanonical ensembles, Maxwell-Boltzmann distributions, and the second law of thermodynamics.",
    tier: "Undergraduate (UG)",
    discipline: "Natural Sciences",
    matchedMisconception: "Entropy & Enthalpy Sign Calculation Traps",
    durationOrPages: "14 pages",
    rating: 4.89
  },

  // Medicine & Physiology
  {
    id: "res-med-1",
    title: "Neuroscience: Synaptic Transmission & Action Potentials",
    source: "Harvard Medical School / Osmosis",
    type: "video",
    url: "https://www.khanacademy.org/science/biology/human-biology/neuron-nervous-system/",
    summary: "High-definition medical animation detailing voltage-gated ion channels, membrane depolarization, and neurotransmitter release.",
    tier: "Undergraduate (UG)",
    discipline: "Medicine & Physiology",
    matchedMisconception: "Ion Gradient & Resting Potential Confusion",
    durationOrPages: "25 mins",
    rating: 4.96
  },
  {
    id: "res-med-2",
    title: "Cellular Respiration & Krebs Cycle Biochemical Pathway",
    source: "BioDigital Human",
    type: "simulation",
    url: "https://human.biodigital.com/",
    summary: "Interactive 3D molecular model of mitochondrial electron transport chain and ATP synthase rotary mechanics.",
    tier: "School (K-12)",
    discipline: "Medicine & Physiology",
    matchedMisconception: "ATP Yield & Electron Transport Misconceptions",
    durationOrPages: "Interactive Sim",
    rating: 4.90
  },

  // Commerce & Finance
  {
    id: "res-fin-1",
    title: "Stochastic Calculus for Quantitative Finance & Black-Scholes",
    source: "Journal of Financial Economics",
    type: "paper",
    url: "https://papers.ssrn.com/",
    summary: "Mathematical derivative pricing paper covering Ito's Lemma, partial differential equations, and risk-neutral valuation.",
    tier: "Postgraduate (PG)",
    discipline: "Commerce & Finance",
    matchedMisconception: "Option Volatility & Stochastic Integration Errors",
    durationOrPages: "20 pages",
    rating: 4.87
  },

  // Law & Humanities
  {
    id: "res-law-1",
    title: "Formal Logic & Syllogisms in Legal Argumentation",
    source: "Oxford Legal Studies",
    type: "cheatsheet",
    url: "https://plato.stanford.edu/entries/logic-classical/",
    summary: "Reference guide for propositional logic, modus ponens, truth tables, and identifying informal fallacies in analytical arguments.",
    tier: "Undergraduate (UG)",
    discipline: "Law & Humanities",
    matchedMisconception: "Logical Fallacy & Premise Validation Errors",
    durationOrPages: "5 pages",
    rating: 4.94
  }
];

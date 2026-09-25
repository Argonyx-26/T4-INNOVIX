# Eduvia / LearnLens AI — Recommended Application Page Architecture

## 1. Purpose

This document reorganizes the current Eduvia / LearnLens AI application into a cleaner information architecture.

The existing specification defines the platform around cognitive misconception detection, scaffolded hints, adaptive learning, visual learning support, vetted resources, teacher intelligence, and accessibility. The current inventory contains the Landing page, AI Diagnostic, Curriculum Explorer, Resource Library, Adaptive Pacing, Learning Paths, Instructors, and Teacher Intelligence views, along with global modals and overlays.

The goal of this structure is to prevent feature clutter by grouping pages according to the user's mental model:

> **Discover → Learn → Diagnose → Understand → Remediate → Verify → Track → Continue**

---

# 2. Core Information Architecture

```text
EDUVIA
│
├── PUBLIC
│   └── Landing /
│
├── AUTHENTICATION
│   ├── Login
│   └── Signup / Onboarding
│
├── STUDENT APPLICATION
│   │
│   ├── Dashboard /student
│   │
│   ├── Learn
│   │   ├── Courses /courses
│   │   ├── Course Detail /courses/:courseId
│   │   └── Learning Paths /paths
│   │
│   ├── Practice
│   │   ├── AI Diagnostic /diagnostic
│   │   └── Adaptive Learning /pacing
│   │
│   ├── My Learning
│   │   ├── Study Plan /plan
│   │   ├── Misconceptions /misconceptions
│   │   └── Diagnostic Reports /diagnostic/:id/results
│   │
│   ├── Resources
│   │   └── Resource Library /library
│   │
│   ├── Mentors
│   │   └── Instructor Directory /mentors
│   │
│   └── Settings /settings
│
├── TEACHER APPLICATION
│   │
│   ├── Dashboard /teacher
│   ├── Live Triage /teacher/triage
│   ├── Students /teacher/students
│   ├── Analytics /teacher/analytics
│   ├── Interventions /teacher/interventions
│   └── Settings /teacher/settings
│
└── GLOBAL FEATURES
    ├── Global Search
    ├── Voice Assistant
    ├── Accessibility Mode Switcher
    ├── Reading Ruler
    ├── Notifications
    ├── Course Syllabus Modal
    ├── Misconception Detail Modal
    └── Classroom Video Preview Modal
```

---

# 3. Public / Landing Experience

## Route

```text
/
```

## Purpose

The Landing page should explain the product, demonstrate the core value proposition, and move users toward starting a diagnostic or entering the application.

It should **not** behave like the authenticated dashboard.

## Structure

```text
LANDING PAGE
│
├── Hero
│   ├── Platform headline
│   ├── Supporting statement
│   ├── Start Free Diagnostic
│   ├── Accessibility quick toggle
│   ├── Audio read-aloud
│   └── 60-second classroom preview
│
├── How Eduvia Works
│   └── 3-Step Cognitive Loop
│       ├── 01 Detect Root Misconception
│       ├── 02 3-Tier Scaffolded Hints
│       └── 03 Verify & Resolve
│
├── Interactive Misconception Sandbox
│
├── Supported Academic Tiers
│   ├── School
│   ├── Undergraduate
│   ├── Postgraduate
│   └── Lifelong Learning
│
├── Supported Disciplines
│   ├── Mathematics
│   ├── Computer Science
│   ├── Medicine & Physiology
│   ├── Commerce & Finance
│   └── Natural Sciences
│
├── Product Capabilities
│   ├── AI Diagnostic
│   ├── Adaptive Learning
│   ├── Learning Paths
│   ├── Resource Library
│   └── Teacher Intelligence
│
├── Accessibility & Inclusion
│   ├── ADHD Focus Mode
│   ├── OpenDyslexic
│   ├── Reading Ruler
│   └── Voice Support
│
├── Teacher Intelligence Preview
│
└── Final CTA
    └── Start Free Diagnostic
```

## Landing Page Principle

The Landing page answers:

> "What is Eduvia and why should I use it?"

It should not expose every internal feature as a top-level navigation item.

---

# 4. Authentication / Onboarding

## Recommended flow

```text
LANDING
   ↓
LOGIN / SIGN UP
   ↓
ROLE
   ├── Student
   └── Teacher / Faculty
   ↓
INITIAL ONBOARDING
   ├── Academic Tier
   ├── Discipline
   ├── Learning Preferences
   └── Accessibility Preferences
   ↓
ROLE DASHBOARD
```

## Authentication UI

Authentication can remain a modal initially.

Recommended components:

```text
Login Modal
Signup Modal
Role Selector
Onboarding Stepper
```

A dedicated full-page authentication flow can be introduced later for enterprise or institutional deployments.

---

# 5. Student Application

## Primary Student Navigation

```text
[EDUVIA]

Dashboard

Learn ▾
    Courses
    Learning Paths

Practice ▾
    AI Diagnostic
    Adaptive Learning

My Learning ▾
    Study Plan
    Misconceptions
    Diagnostic Reports

Resources

Mentors

                         Search
                         Accessibility
                         Voice
                         Profile
```

## Navigation philosophy

The navigation is organized around **intent**, not implementation:

| Navigation Group | User Question |
|---|---|
| Dashboard | What should I do now? |
| Learn | What can I learn? |
| Practice | What do I need to work on? |
| My Learning | How am I progressing? |
| Resources | What can help me? |
| Mentors | Can a human expert help me? |

---

# 6. Student Dashboard

## Route

```text
/student
```

## Importance

**Essential addition.**

The dashboard should become the student's authenticated home page.

## Structure

```text
STUDENT DASHBOARD
│
├── Header
│
├── Greeting / Current Context
│
├── Today's Recommended Action
│   └── Start Diagnostic / Continue Learning
│
├── Continue Learning
│   ├── Current Course
│   ├── Current Learning Path
│   └── Resume Practice
│
├── Active Misconceptions
│   ├── Detected
│   ├── Remediating
│   ├── Re-evaluating
│   └── Resolved
│
├── Mastery Snapshot
│   ├── Overall Mastery
│   ├── Recent Improvement
│   └── Concept Stability
│
├── Cognitive Velocity
│   ├── Completion Speed
│   ├── Hint Reliance
│   └── Time Saved
│
├── Recommended Resources
│
└── Recent Activity
```

## Dashboard design principle

The dashboard should answer:

> **"What should I do next?"**

It should not become a giant analytics page.

---

# 7. Learn Section

## Learn Navigation

```text
LEARN
│
├── Courses
└── Learning Paths
```

---

# 8. Course Explorer

## Route

```text
/courses
```

## Purpose

Discover available courses.

## Structure

```text
COURSE EXPLORER
│
├── Search
│
├── Academic Tier Filter
│   ├── School
│   ├── UG
│   └── PG
│
├── Discipline Filter
│
├── Risk Level Filter
│
├── Bookmarked Courses Filter
│
└── Course Grid
    └── Course Card
        ├── Title
        ├── Description
        ├── Tier
        ├── Discipline
        ├── Risk Level
        ├── Prerequisites
        ├── Progress
        └── Open
```

---

# 9. Course Preview / Syllabus

## Route

Use a modal initially:

```text
CourseModal
```

For a deeper implementation, use:

```text
/courses/:courseId
```

## Quick Preview

```text
COURSE PREVIEW
│
├── Course Overview
├── Difficulty / Risk
├── Prerequisites
├── Module List
├── Estimated Duration
├── Current Progress
└── Start / Continue
```

---

# 10. Course Detail / Course Workspace

## Route

```text
/courses/:courseId
```

## Recommended structure

```text
COURSE WORKSPACE
│
├── Course Header
│   ├── Title
│   ├── Progress
│   └── Continue
│
├── Overview
│
├── Modules
│   ├── Module 1
│   ├── Module 2
│   ├── Module 3
│   └── ...
│
├── Prerequisites
│
├── Concepts
│
├── Diagnostic Challenges
│
├── Practice
│
└── Recommended Resources
```

## Principle

A Course page answers:

> **"What am I studying?"**

A Learning Path answers:

> **"What should I study next and in what order?"**

---

# 11. Learning Paths

## Route

```text
/paths
```

## Purpose

Provide a sequential mastery journey.

## Structure

```text
LEARNING PATH
│
├── Current Path
│
├── Progress Overview
│
├── Stage 1
│   └── Foundational Axioms & Invariants
│
├── Stage 2
│   └── Procedural Mechanics & Common Traps
│
├── Stage 3
│   └── Boundary & Edge Case Diagnosis
│
├── Stage 4
│   └── Cross-Domain Conceptual Transfer
│
└── Stage 5
    └── Real-World Synthesis & Independent Proofs
```

## UI

Use a visual timeline rather than a normal grid.

```text
● Stage 1 ─── ● Stage 2 ─── ◉ Stage 3 ─── ○ Stage 4 ─── ○ Stage 5
Completed       Completed     Current        Locked        Locked
```

---

# 12. Practice Section

## Practice Navigation

```text
PRACTICE
│
├── AI Diagnostic
└── Adaptive Learning
```

The AI Diagnostic is the **core product workflow**.

---

# 13. AI Diagnostic

## Route

```text
/diagnostic
```

## Core structure

```text
AI DIAGNOSTIC
│
├── Setup
│   ├── Academic Tier
│   ├── Discipline
│   └── Diagnostic Type
│
├── Stage 1
│   └── Diagnostic Challenge
│
├── Stage 2
│   └── Cognitive Pattern Identification
│
├── Stage 3
│   └── 60-Second Micro-Intervention
│
├── Stage 4
│   └── Verification Transfer Question
│
└── Stage 5
    └── Misconception State Resolution
```

## Do NOT create separate pages for these stages

Keep these inside the diagnostic workspace.

```text
Diagnostic
   ├── Question
   ├── Answer
   ├── Diagnosis
   ├── Hint
   ├── Intervention
   ├── Verification
   └── Resolution
```

This should feel like **one continuous cognitive loop**, not seven different pages.

---

# 14. Diagnostic Workspace Layout

Recommended layout:

```text
┌──────────────────────────────────────────────────────┐
│ Diagnostic Progress                                  │
│ Stage 2 of 5                                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│               QUESTION / DIAGNOSIS                   │
│                                                      │
│               Main focused content                  │
│                                                      │
├────────────────────────────┬─────────────────────────┤
│ Need a Hint?               │ Concept / Mind Map      │
│ Tier 1                     │                         │
│ Tier 2                     │                         │
│ Tier 3                     │                         │
├────────────────────────────┴─────────────────────────┤
│ Recommended resources / next action                  │
└──────────────────────────────────────────────────────┘
```

In ADHD Focus mode, simplify this to a single dominant task card.

In OpenDyslexic mode, increase spacing, use the accessibility typography, and expose reading/audio tools without clutter.

---

# 15. Diagnostic Results / Learning Report

## Route

```text
/diagnostic/:id/results
```

## Importance

**Highly recommended addition.**

Do not make the final result merely a toast or small modal.

## Structure

```text
DIAGNOSTIC REPORT
│
├── Overall Result
│
├── Concepts Demonstrated
│
├── Misconceptions Detected
│
├── Prerequisite Gaps
│
├── Cognitive Diagnosis
│
├── Hint Reliance
│
├── Time / Cognitive Velocity
│
├── Concepts Resolved
│
├── Concepts Still At Risk
│
├── Recommended Intervention
│
├── Recommended Resources
│
└── Next Recommended Action
```

## Main CTA

```text
[Continue Learning]
```

Secondary CTA:

```text
[Review Misconceptions]
```

---

# 16. Misconception Center

## Route

```text
/misconceptions
```

## Importance

**Highly recommended addition and potential signature feature.**

The platform's distinctive value is not only detecting wrong answers but diagnosing underlying thinking errors.

## Structure

```text
MY MISCONCEPTIONS
│
├── Tabs
│   ├── All
│   ├── Active
│   ├── Remediating
│   ├── Re-evaluating
│   └── Resolved
│
├── Search
│
└── Misconception Cards
    │
    ├── Concept
    ├── Misconception
    ├── Status
    ├── Recurrence
    ├── Last Detected
    ├── Mastery
    └── Review / Practice
```

---

# 17. Misconception Detail

## Route

```text
/misconceptions/:id
```

## Structure

```text
MISCONCEPTION DETAIL
│
├── Misconception Name
├── Current State
│
├── What I Got Wrong
│
├── Why I Got It Wrong
│
├── Cognitive Explanation
│
├── Related Prerequisites
│
├── Concept Mind Map
│
├── Intervention History
│
├── Hints Used
│
├── Verification Attempts
│
├── Recommended Resources
│
└── Practice Again
```

---

# 18. Adaptive Learning

## Route

```text
/pacing
```

## Navigation Label

Use:

```text
Adaptive Learning
```

rather than:

```text
Intelligent Adaptive Pacing
```

The shorter label is easier for students to understand.

## Structure

```text
ADAPTIVE LEARNING
│
├── Cognitive Velocity
│   ├── Completion Speed
│   ├── Hint Reliance
│   └── Time Saved
│
├── Mastery Trajectory
│
├── Learning Acceleration
│   └── Standard vs Adaptive comparison
│
└── Interactive Labs
    ├── Distributive Law Sandbox
    ├── Pointer / Heap / Stack Simulator
    └── Balance Sheet / Working Capital Sandbox
```

---

# 19. My Learning / Study Plan

## Route

```text
/plan
```

## Importance

**Recommended addition.**

The specification already includes bookmarking and local study planning, but a dedicated destination makes that workflow much clearer.

## Structure

```text
MY LEARNING PLAN
│
├── Today
│   ├── Recommended Diagnostic
│   ├── Review Misconception
│   └── Resource
│
├── This Week
│   ├── Learning Path Milestones
│   ├── Practice
│   └── Revision
│
├── Saved Courses
│
├── Saved Resources
│
└── Completed Items
```

---

# 20. Resource Library

## Route

```text
/library
```

## Structure

```text
RESOURCE LIBRARY
│
├── Search
│
├── Media Type
│   ├── All
│   ├── Interactive Simulations
│   ├── Video Micro-lessons
│   ├── Research Papers
│   └── Cheatsheets
│
├── Discipline Filter
│
├── Academic Tier Filter
│
├── Misconception Filter
│
└── Resource Grid
    └── Resource Card
        ├── Provider
        ├── Type
        ├── Topic
        ├── Misconception
        ├── Bookmark
        └── Open Resource
```

## Contextual Resource Integration

Resources should also appear inside Diagnostic and Misconception Detail.

```text
MISCONCEPTION DETECTED
        ↓
Recommended Resources
        ├── Video
        ├── Simulation
        ├── Cheatsheet
        └── Research / Reference
```

This prevents the user from having to leave the diagnostic workflow to search for help.

---

# 21. Mentors / Instructors

## Route

```text
/mentors
```

## Structure

```text
MENTORS
│
├── Search
│
├── Filters
│   ├── Discipline
│   ├── Academic Level
│   └── Specialization
│
└── Instructor Cards
    ├── Name
    ├── Credentials
    ├── Specialization
    ├── Publications
    ├── Student Feedback
    └── View Profile
```

---

# 22. Instructor Profile

## Recommended route

```text
/mentors/:mentorId
```

## Structure

```text
INSTRUCTOR PROFILE
│
├── Profile
├── Credentials
├── Specializations
├── Publications
├── Verified Student Feedback
├── Available Office Hours
└── Book Office Hours
```

---

# 23. Student Settings

## Route

```text
/settings
```

## Structure

```text
SETTINGS
│
├── Profile
│
├── Academic Information
│
├── Learning Preferences
│
├── Accessibility
│   ├── Normal Mode
│   ├── ADHD Focus Mode
│   └── OpenDyslexic Mode
│
├── Typography / Reading
│
├── Audio Preferences
│
├── Voice Controls
│
├── Notifications
│
└── Account
```

Accessibility should be treated as a core product setting, not merely a visual theme.

---

# 24. Teacher Application

Teacher functionality should be a separate workspace.

Do not make Teacher Intelligence just another student navigation item.

```text
Teacher Login
     ↓
Teacher Dashboard
     ↓
Teacher Workspace
```

---

# 25. Teacher Navigation

```text
[EDUVIA]

Overview

Live Triage

Students

Analytics

Interventions

                         Search
                         Profile
                         Settings
```

---

# 26. Teacher Dashboard

## Route

```text
/teacher
```

## Structure

```text
TEACHER DASHBOARD
│
├── Class Overview
│
├── Students Needing Intervention
│
├── Current Misconception Hotspots
│
├── Class Mastery
│
├── Recent Diagnostic Activity
│
├── Active Remedial Pods
│
├── Recommended Interventions
│
└── Quick Actions
    ├── Open Live Triage
    ├── Generate Remedial Pods
    └── Generate Reteaching Plan
```

The dashboard should provide a high-level summary while detailed analysis lives in dedicated pages.

---

# 27. Live Triage

## Route

```text
/teacher/triage
```

## Structure

```text
LIVE TRIAGE
│
├── Live Feed
│
├── NEEDS_INTERVENTION
│
├── Recently Resolved
│
├── High Priority
│
└── Student Activity Cards
    ├── Student
    ├── Concept
    ├── Misconception
    ├── Severity / Priority
    ├── Timestamp
    └── Open Student
```

Use the real-time Firestore listener here.

This page should be operational and fast rather than analytical.

---

# 28. Teacher Students / Cohort

## Route

```text
/teacher/students
```

## Structure

```text
STUDENTS
│
├── Search
├── Filters
│
├── Student Table
│   ├── Name
│   ├── Mastery
│   ├── Misconception Recurrence
│   ├── Velocity
│   ├── Hint Reliance
│   └── Status
│
└── Student Profile
```

---

# 29. Teacher Student Profile

## Route

```text
/teacher/students/:studentId
```

## Structure

```text
STUDENT PROFILE
│
├── Overview
│
├── Mastery
│
├── Misconceptions
│
├── Diagnostic History
│
├── Cognitive Velocity
│
├── Hint Reliance
│
├── Learning Path
│
├── Work Samples
│
└── Intervention History
```

---

# 30. Teacher Analytics

## Route

```text
/teacher/analytics
```

## Structure

```text
ANALYTICS
│
├── Class Mastery
│
├── Misconception Heatmap
│
├── Misconception Recurrence
│
├── Learning Velocity
│
├── Hint Reliance
│
├── Concept Performance
│
└── Trend Analysis
```

Keep analytics visually dense enough for faculty use, but organized into clear sections.

---

# 31. Teacher Intelligence / RAG

## Recommended placement

This can be a major panel within Teacher Dashboard or a dedicated sub-page:

```text
/teacher/intelligence
```

## Structure

```text
TEACHER INTELLIGENCE
│
├── Natural Language Query
│
├── Query History
│
├── AI Answer
│   ├── Summary
│   ├── Students
│   ├── Concepts
│   └── Work Samples
│
└── Suggested Queries
```

Examples:

```text
"Which students are struggling with pointer aliasing?"

"Summarize this student's learning trajectory."

"Classify mathematical errors in Section B."
```

---

# 32. Teacher Interventions

## Route

```text
/teacher/interventions
```

## Structure

```text
INTERVENTIONS
│
├── Active Interventions
│
├── Remedial Pods
│   ├── Generate Pods
│   ├── Pod Members
│   ├── Shared Prerequisite Gap
│   └── Study Guide
│
├── Reteaching Plans
│   ├── Generate
│   ├── Starter Slides
│   └── Warmup Problems
│
└── Intervention History
```

---

# 33. Global Components

These should **not become navigation pages**.

## Global Header

```text
┌────────────────────────────────────────────────────────┐
│ EDUVIA   Navigation                  Search  ♿  🎤  👤 │
└────────────────────────────────────────────────────────┘
```

## Global Utilities

```text
Global Search
Voice Assistant
Accessibility Mode Switcher
Reading Ruler
Notifications
Profile Menu
```

## Modals

```text
Login Modal
Course Syllabus Modal
Voice Assistant Modal
Search Modal
Video Preview Modal
Misconception Detail Modal
```

---

# 34. Features That Should Stay Inside Existing Pages

Do not create independent pages for these:

```text
❌ Hints
❌ Hint Tier 1
❌ Hint Tier 2
❌ Hint Tier 3
❌ Cognitive Diagnosis
❌ Micro Intervention
❌ Verification
❌ Concept Mind Map
❌ Reading Ruler
❌ Voice Assistant
❌ Course Syllabus
❌ Video Preview
```

These are contextual interactions.

Recommended structure:

```text
AI DIAGNOSTIC
│
├── Question
├── Answer
├── Diagnosis
├── Hint Drawer
├── Concept Mind Map Drawer
├── Micro Intervention
├── Verification
└── Resolution
```

---

# 35. Optional Concept Explorer

## Route

```text
/concepts
```

This is useful but should not be required for the MVP.

## Structure

```text
CONCEPT EXPLORER
│
├── Search
├── Discipline
├── Academic Tier
│
└── Concept Graph
    ├── Prerequisites
    ├── Current Concept
    ├── Common Misconceptions
    └── Target Concepts
```

Concept pages can expose:

```text
Concept
│
├── Explanation
├── Prerequisites
├── Related Concepts
├── Common Misconceptions
├── Practice
├── Resources
└── Mind Map
```

---

# 36. Recommended URL Architecture

```text
PUBLIC
/

STUDENT
/student
/courses
/courses/:courseId
/paths
/diagnostic
/diagnostic/:id/results
/pacing
/plan
/misconceptions
/misconceptions/:id
/library
/mentors
/mentors/:mentorId
/settings

TEACHER
/teacher
/teacher/triage
/teacher/students
/teacher/students/:studentId
/teacher/analytics
/teacher/intelligence
/teacher/interventions
/teacher/settings

OPTIONAL
/concepts
```

---

# 37. Final Recommended Sitemap

```text
EDUVIA
│
├── PUBLIC
│   └── Landing /
│
├── AUTH
│   ├── Login
│   ├── Signup
│   └── Onboarding
│
├── STUDENT
│   │
│   ├── Dashboard
│   │
│   ├── Learn
│   │   ├── Courses
│   │   ├── Course Detail
│   │   └── Learning Paths
│   │
│   ├── Practice
│   │   ├── AI Diagnostic
│   │   └── Adaptive Learning
│   │
│   ├── My Learning
│   │   ├── Study Plan
│   │   ├── Misconceptions
│   │   └── Diagnostic Reports
│   │
│   ├── Resources
│   │   └── Resource Library
│   │
│   ├── Mentors
│   │   └── Instructor Profiles
│   │
│   └── Settings
│
├── TEACHER
│   │
│   ├── Dashboard
│   ├── Live Triage
│   ├── Students
│   │   └── Student Profile
│   ├── Analytics
│   ├── Intelligence / RAG
│   ├── Interventions
│   └── Settings
│
├── OPTIONAL
│   └── Concept Explorer
│
└── GLOBAL
    ├── Search
    ├── Voice
    ├── Accessibility
    ├── Reading Ruler
    ├── Notifications
    └── Contextual Modals
```

---

# 38. Ideal Student Journey

```text
LANDING
   ↓
LOGIN / SIGN UP
   ↓
STUDENT DASHBOARD
   ↓
┌──────────────────────────────────────┐
│                                      │
│     What do I want to do?            │
│                                      │
│  Continue Learning   Start Practice  │
│                                      │
└──────────────────────────────────────┘
         ↓                  ↓
       LEARN             PRACTICE
         ↓                  ↓
     COURSE / PATH       DIAGNOSTIC
                              ↓
                         MISCONCEPTION
                              ↓
                         INTERVENTION
                              ↓
                         VERIFICATION
                              ↓
                          RESOLVED
                              ↓
                       DIAGNOSTIC REPORT
                              ↓
                     RECOMMENDED NEXT STEP
                              ↓
                         DASHBOARD
```

---

# 39. Ideal Teacher Journey

```text
TEACHER LOGIN
      ↓
TEACHER DASHBOARD
      ↓
┌─────────────────────────────────────────────┐
│                                             │
│ Live Triage   Students   Analytics          │
│                                             │
└─────────────────────────────────────────────┘
      ↓
IDENTIFY PROBLEM
      ↓
RAG QUERY / ANALYTICS
      ↓
IDENTIFY COHORT / MISCONCEPTION
      ↓
GENERATE REMEDIAL POD
      ↓
GENERATE RETEACHING PLAN
      ↓
INTERVENTION
      ↓
MONITOR OUTCOME
```

---

# 40. MVP Priority

Do not build every recommended page at once.

## Priority 1 — Essential

```text
1. Landing
2. Login / Onboarding
3. Student Dashboard
4. AI Diagnostic
5. Diagnostic Results
6. Misconception Center
7. Courses
8. Learning Paths
9. Resource Library
10. Teacher Dashboard
11. Teacher Students
12. Teacher Analytics
```

## Priority 2 — Strong Enhancements

```text
13. Adaptive Learning
14. Study Plan
15. Misconception Detail
16. Course Detail
17. Live Triage
18. Teacher Interventions
19. Teacher Intelligence / RAG
20. Instructor Directory
```

## Priority 3 — Expansion

```text
21. Concept Explorer
22. Instructor Profiles
23. Advanced analytics
24. Enterprise / institutional settings
25. More detailed learning reports
```

---

# 41. Final Navigation Recommendation

## Student

```text
[EDUVIA]

Dashboard

Learn ▾
  Courses
  Learning Paths

Practice ▾
  AI Diagnostic
  Adaptive Learning

My Learning ▾
  Study Plan
  Misconceptions
  Reports

Resources

Mentors

                    🔍  ♿  🎤  👤
```

## Teacher

```text
[EDUVIA]

Overview

Live Triage

Students

Analytics

Interventions

                    🔍  👤  ⚙
```

---

# 42. Key Design Principle

The application should not be organized as:

```text
Home
Diagnostic
Courses
Library
Pacing
Paths
Mentors
Teacher
```

because this makes every feature look equally important.

Instead, organize it as:

```text
                 EDUVIA
                    │
        ┌───────────┴───────────┐
        │                       │
     STUDENT                 TEACHER
        │                       │
    Dashboard               Dashboard
        │                       │
   ┌────┼────┐             ┌────┼────┐
   │    │    │             │    │    │
 Learn Practice My Learning  Students Analytics
   │      │       │                 │
Courses Diagnostic Misconceptions   │
Paths    Adaptive  Reports           │
         Learning  Study Plan        │
                                      │
                              Interventions
                                      │
                               Teacher Intelligence
```

The defining product loop remains:

> **Discover → Learn → Diagnose → Understand → Remediate → Verify → Track → Continue**

This structure keeps the existing functionality while giving each feature a clear place in the user's journey.

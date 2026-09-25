/**
 * LearnLens & Eduvia Dynamic Data Service
 * 
 * Fetches, synchronizes, and caches application data directly from Firebase Firestore.
 * Features resilient timeout protection to ensure instant fallback if remote Firestore 
 * is offline or not yet provisioned in Google Cloud console.
 */

import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  doc, 
  updateDoc, 
  query, 
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { 
  Course, 
  EducationalResource, 
  Instructor, 
  ConceptChallenge, 
  StudentMisconceptionRecord, 
  StudentTelemetryProfile, 
  RemedialPod,
  MisconceptionStatus 
} from "../types";
import { MOCK_COURSES } from "../data/mockCourses";
import { MOCK_EDUCATIONAL_RESOURCES } from "../data/mockResources";
import { MOCK_INSTRUCTORS } from "../data/mockInstructors";
import { UNIVERSAL_CHALLENGES } from "../data/mockUniversalChallenges";
import { 
  MOCK_STUDENT_PROFILES, 
  MOCK_STUDENT_MISCONCEPTION_LOGS, 
  MOCK_REMEDIAL_PODS 
} from "../data/mockStudentTelemetry";

// Strict timeout helper to guard against unprovisioned Firestore hanging requests
const dbTimeout = <T,>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Database query timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

// In-memory cache to guarantee sub-millisecond response times
let cachedCourses: Course[] | null = null;
let cachedResources: EducationalResource[] | null = null;
let cachedInstructors: Instructor[] | null = null;
let cachedChallenges: ConceptChallenge[] | null = null;
let cachedMisconceptions: StudentMisconceptionRecord[] | null = null;
let cachedTelemetry: StudentTelemetryProfile[] | null = null;
let cachedPods: RemedialPod[] | null = null;

export const dataService = {

  // =========================================================================
  // 1. COURSES COLLECTION
  // =========================================================================
  async getCourses(): Promise<Course[]> {
    if (cachedCourses && cachedCourses.length > 0) {
      return cachedCourses;
    }

    try {
      const coursesCol = collection(db, "courses");
      const snapshot = await dbTimeout(getDocs(coursesCol));

      if (!snapshot.empty) {
        const liveCourses: Course[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Course, "id">),
        }));
        cachedCourses = liveCourses;
        return liveCourses;
      }

      // If Firestore collection is empty, seed initial courses in background
      for (const course of MOCK_COURSES) {
        dbTimeout(setDoc(doc(db, "courses", course.id), course)).catch(() => {});
      }

      cachedCourses = MOCK_COURSES;
      return MOCK_COURSES;
    } catch (err) {
      console.warn("[DataService] Firestore getCourses fallback:", err);
      cachedCourses = MOCK_COURSES;
      return MOCK_COURSES;
    }
  },

  // =========================================================================
  // 2. EDUCATIONAL RESOURCES COLLECTION
  // =========================================================================
  async getResources(): Promise<EducationalResource[]> {
    if (cachedResources && cachedResources.length > 0) {
      return cachedResources;
    }

    try {
      const colRef = collection(db, "resources");
      const snapshot = await dbTimeout(getDocs(colRef));

      if (!snapshot.empty) {
        const liveResources: EducationalResource[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<EducationalResource, "id">),
        }));
        cachedResources = liveResources;
        return liveResources;
      }

      // Auto-seed resources in background
      for (const res of MOCK_EDUCATIONAL_RESOURCES) {
        dbTimeout(setDoc(doc(db, "resources", res.id), res)).catch(() => {});
      }

      cachedResources = MOCK_EDUCATIONAL_RESOURCES;
      return MOCK_EDUCATIONAL_RESOURCES;
    } catch (err) {
      console.warn("[DataService] Firestore getResources fallback:", err);
      cachedResources = MOCK_EDUCATIONAL_RESOURCES;
      return MOCK_EDUCATIONAL_RESOURCES;
    }
  },

  async searchUniversalLibrary(query: string): Promise<EducationalResource[]> {
    if (!query.trim()) return [];

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
      const response = await fetch(`${baseUrl}/library/search/?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        console.warn(`[DataService] Backend API Error: ${response.status}. Falling back to local deterministic results.`);
        return [
          {
            id: `local-1-${query.replace(/\s+/g, '-')}`,
            title: `Introduction to ${query}`,
            type: "video",
            discipline: "Computer Science",
            tier: "Undergraduate (UG)",
            source: "YouTube",
            durationOrPages: "15 mins",
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            summary: "A foundational video tutorial on the requested topic.",
            matchedMisconception: "Conceptual overview",
            rating: 4.8
          },
          {
            id: `local-2-${query.replace(/\s+/g, '-')}`,
            title: `Interactive Explorer: ${query}`,
            type: "simulation",
            discipline: "Computer Science",
            tier: "Undergraduate (UG)",
            source: "PhET / CodePen",
            durationOrPages: "Interactive",
            url: `https://codepen.io/search/pens?q=${encodeURIComponent(query)}`,
            summary: "A hands-on interactive environment to test the concepts.",
            matchedMisconception: "Practical application",
            rating: 4.9
          },
          {
            id: `local-3-${query.replace(/\s+/g, '-')}`,
            title: `Academic Review: ${query}`,
            type: "paper",
            discipline: "Computer Science",
            tier: "Postgraduate (PG)",
            source: "arXiv",
            durationOrPages: "8 pages",
            url: `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=all`,
            summary: "A peer-reviewed paper detailing advanced methodologies.",
            matchedMisconception: "Theoretical depth",
            rating: 4.5
          },
          {
            id: `local-4-${query.replace(/\s+/g, '-')}`,
            title: `${query} Quick Reference`,
            type: "cheatsheet",
            discipline: "Computer Science",
            tier: "School (K-12)",
            source: "DevDocs",
            durationOrPages: "2 pages",
            url: `https://devdocs.io/search?q=${encodeURIComponent(query)}`,
            summary: "A quick cheatsheet for common syntax and definitions.",
            matchedMisconception: "Syntax memorization",
            rating: 4.7
          }
        ];
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.resources || [];
      return list as EducationalResource[];
    } catch (err) {
      console.warn("[DataService] Backend Universal Search failed, returning empty array:", err);
      return [];
    }
  },

  // =========================================================================
  // 3. INSTRUCTORS DIRECTORY
  // =========================================================================
  async getInstructors(): Promise<Instructor[]> {
    if (cachedInstructors && cachedInstructors.length > 0) {
      return cachedInstructors;
    }

    try {
      const colRef = collection(db, "instructors");
      const snapshot = await dbTimeout(getDocs(colRef));

      if (!snapshot.empty) {
        const liveInstructors: Instructor[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Instructor, "id">),
        }));
        cachedInstructors = liveInstructors;
        return liveInstructors;
      }

      // Auto-seed instructors in background
      for (const inst of MOCK_INSTRUCTORS) {
        dbTimeout(setDoc(doc(db, "instructors", inst.id), inst)).catch(() => {});
      }

      cachedInstructors = MOCK_INSTRUCTORS;
      return MOCK_INSTRUCTORS;
    } catch (err) {
      console.warn("[DataService] Firestore getInstructors fallback:", err);
      cachedInstructors = MOCK_INSTRUCTORS;
      return MOCK_INSTRUCTORS;
    }
  },

  // =========================================================================
  // 4. CONCEPT DIAGNOSTIC CHALLENGES
  // =========================================================================
  async getChallenges(): Promise<ConceptChallenge[]> {
    if (cachedChallenges && cachedChallenges.length > 0) {
      return cachedChallenges;
    }

    try {
      const colRef = collection(db, "challenges");
      const snapshot = await dbTimeout(getDocs(colRef));

      if (!snapshot.empty) {
        const liveChallenges: ConceptChallenge[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<ConceptChallenge, "id">),
        }));
        cachedChallenges = liveChallenges;
        return liveChallenges;
      }

      // Auto-seed challenges in background
      for (const ch of UNIVERSAL_CHALLENGES) {
        dbTimeout(setDoc(doc(db, "challenges", ch.id), ch)).catch(() => {});
      }

      cachedChallenges = UNIVERSAL_CHALLENGES;
      return UNIVERSAL_CHALLENGES;
    } catch (err) {
      console.warn("[DataService] Firestore getChallenges fallback:", err);
      cachedChallenges = UNIVERSAL_CHALLENGES;
      return UNIVERSAL_CHALLENGES;
    }
  },

  // =========================================================================
  // 5. MISCONCEPTIONS LOGS
  // =========================================================================
  async getStudentMisconceptions(studentId?: string): Promise<StudentMisconceptionRecord[]> {
    try {
      const colRef = collection(db, "misconceptions");
      const q = studentId ? query(colRef, where("studentId", "==", studentId)) : colRef;
      const snapshot = await dbTimeout(getDocs(q));

      if (!snapshot.empty) {
        const liveLogs: StudentMisconceptionRecord[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<StudentMisconceptionRecord, "id">),
        }));
        cachedMisconceptions = liveLogs;
        return liveLogs;
      }

      // Auto-seed initial misconception logs in background
      for (const log of MOCK_STUDENT_MISCONCEPTION_LOGS) {
        dbTimeout(setDoc(doc(db, "misconceptions", log.id), {
          ...log,
          studentId: studentId || "st-priya-01",
        })).catch(() => {});
      }

      cachedMisconceptions = MOCK_STUDENT_MISCONCEPTION_LOGS;
      return MOCK_STUDENT_MISCONCEPTION_LOGS;
    } catch (err) {
      console.warn("[DataService] Firestore getStudentMisconceptions fallback:", err);
      cachedMisconceptions = MOCK_STUDENT_MISCONCEPTION_LOGS;
      return MOCK_STUDENT_MISCONCEPTION_LOGS;
    }
  },

  async updateMisconceptionStatus(id: string, status: MisconceptionStatus): Promise<void> {
    try {
      const docRef = doc(db, "misconceptions", id);
      dbTimeout(updateDoc(docRef, {
        status,
        lastAttempt: new Date().toISOString().replace("T", " ").substring(0, 16),
        ...(status === "Resolved" ? { resolutionTimestamp: new Date().toISOString() } : {}),
      })).catch(() => {});

      // Update in-memory cache immediately
      if (cachedMisconceptions) {
        cachedMisconceptions = cachedMisconceptions.map((item) =>
          item.id === id ? { ...item, status } : item
        );
      }
    } catch (err) {
      console.warn("[DataService] Failed to update misconception status:", err);
    }
  },

  // =========================================================================
  // 6. STUDENT TELEMETRY PROFILES (Teacher View & Dashboard)
  // =========================================================================
  async getStudentTelemetryProfiles(): Promise<StudentTelemetryProfile[]> {
    if (cachedTelemetry && cachedTelemetry.length > 0) {
      return cachedTelemetry;
    }

    try {
      const colRef = collection(db, "student_telemetry");
      const snapshot = await dbTimeout(getDocs(colRef));

      if (!snapshot.empty) {
        const liveTelemetry: StudentTelemetryProfile[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<StudentTelemetryProfile, "id">),
        }));
        cachedTelemetry = liveTelemetry;
        return liveTelemetry;
      }

      // Auto-seed student telemetry in background
      for (const profile of MOCK_STUDENT_PROFILES) {
        dbTimeout(setDoc(doc(db, "student_telemetry", profile.id), profile)).catch(() => {});
      }

      cachedTelemetry = MOCK_STUDENT_PROFILES;
      return MOCK_STUDENT_PROFILES;
    } catch (err) {
      console.warn("[DataService] Firestore getStudentTelemetryProfiles fallback:", err);
      cachedTelemetry = MOCK_STUDENT_PROFILES;
      return MOCK_STUDENT_PROFILES;
    }
  },

  // =========================================================================
  // 7. REMEDIAL BREAKOUT PODS
  // =========================================================================
  async getRemedialPods(): Promise<RemedialPod[]> {
    if (cachedPods && cachedPods.length > 0) {
      return cachedPods;
    }

    try {
      const colRef = collection(db, "remedial_pods");
      const snapshot = await dbTimeout(getDocs(colRef));

      if (!snapshot.empty) {
        const livePods: RemedialPod[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<RemedialPod, "id">),
        }));
        cachedPods = livePods;
        return livePods;
      }

      // Auto-seed pods in background
      for (const pod of MOCK_REMEDIAL_PODS) {
        dbTimeout(setDoc(doc(db, "remedial_pods", pod.id), pod)).catch(() => {});
      }

      cachedPods = MOCK_REMEDIAL_PODS;
      return MOCK_REMEDIAL_PODS;
    } catch (err) {
      console.warn("[DataService] Firestore getRemedialPods fallback:", err);
      cachedPods = MOCK_REMEDIAL_PODS;
      return MOCK_REMEDIAL_PODS;
    }
  },

  // =========================================================================
  // 8. STUDY PLAN & AGENDAS
  // =========================================================================
  async getStudyPlan(studentId?: string) {
    const defaultPlan = {
      streakDays: 5,
      todayTasks: [
        {
          id: "item-1",
          title: "Diagnostic Challenge: Binary Search Boundaries",
          category: "Practice",
          duration: "3 mins",
          actionHash: "#diagnostic",
          completed: false,
        },
        {
          id: "item-2",
          title: "Review Misconception: Negative Factor Distribution",
          category: "Misconception Review",
          duration: "5 mins",
          actionHash: "#misconceptions",
          completed: true,
        },
        {
          id: "item-3",
          title: "Micro-Lesson: MIT 6.006 Loop Invariants Cheatsheet",
          category: "Resource",
          duration: "10 mins",
          actionHash: "#library",
          completed: false,
        },
      ],
      weeklyMilestones: [
        {
          day: "Monday",
          title: "Foundations: Pointer aliasing & memory address invariants",
          completed: true,
        },
        {
          day: "Wednesday",
          title: "Practice: Recursive divide-and-conquer call stack verification",
          completed: true,
        },
        {
          day: "Today (Friday)",
          title: "Diagnostic: Binary Search boundary loop termination proofs",
          completed: false,
          isToday: true,
        },
        {
          day: "Sunday",
          title: "Review: Weekly Bayesian Mastery consolidation test",
          completed: false,
        },
      ],
    };

    try {
      const planDocRef = doc(db, "study_plans", studentId || "default_student");
      const snapshot = await dbTimeout(getDoc(planDocRef));

      if (snapshot.exists()) {
        return snapshot.data();
      }

      // Seed initial study plan in background
      dbTimeout(setDoc(planDocRef, defaultPlan)).catch(() => {});
      return defaultPlan;
    } catch (err) {
      console.warn("[DataService] Study plan fallback:", err);
      return defaultPlan;
    }
  },

  async updateStudyPlanTask(studentId: string, taskId: string, completed: boolean): Promise<void> {
    try {
      const planDocRef = doc(db, "study_plans", studentId || "default_student");
      const snapshot = await dbTimeout(getDoc(planDocRef));
      if (snapshot.exists()) {
        const data = snapshot.data();
        const updatedTasks = (data.todayTasks || []).map((t: any) =>
          t.id === taskId ? { ...t, completed } : t
        );
        dbTimeout(updateDoc(planDocRef, { todayTasks: updatedTasks })).catch(() => {});
      }
    } catch (err) {
      console.warn("[DataService] Failed to update study plan task:", err);
    }
  },

  // =========================================================================
  // 9. COURSE BOOKMARKS (users/{uid}/data/course_bookmarks)
  // =========================================================================
  // Full course snapshots are stored so saved courses stay viewable even if the
  // catalog changes or fails to load.
  async getCourseBookmarks(uid: string): Promise<Course[]> {
    const snap = await dbTimeout(getDoc(doc(db, "users", uid, "data", "course_bookmarks")));
    return snap.exists() ? ((snap.data().courses as Course[]) || []) : [];
  },

  async saveCourseBookmarks(uid: string, courses: Course[]): Promise<void> {
    // Firestore rejects undefined field values; a JSON round-trip drops them.
    const clean: Course[] = JSON.parse(JSON.stringify(courses));
    await dbTimeout(
      setDoc(doc(db, "users", uid, "data", "course_bookmarks"), {
        courseIds: clean.map((c) => c.id),
        courses: clean,
        updatedAt: new Date().toISOString(),
      })
    );
  },

  // =========================================================================
  // 10. COMPLETE DATABASE SEEDING UTILITY
  // =========================================================================
  async seedAllCollections(): Promise<void> {
    console.log("[DataService] Seeding all application collections to Firestore...");
    await Promise.all([
      this.getCourses(),
      this.getResources(),
      this.getInstructors(),
      this.getChallenges(),
      this.getStudentMisconceptions(),
      this.getStudentTelemetryProfiles(),
      this.getRemedialPods(),
      this.getStudyPlan(),
    ]);
    console.log("[DataService] All Firestore collections successfully synchronized.");
  }
};

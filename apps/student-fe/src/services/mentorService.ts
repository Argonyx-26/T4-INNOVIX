import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile } from "../types";

const withTimeout = <T,>(promise: Promise<T>, ms = 10000): Promise<T> =>
  Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms))]);

export interface TeacherSummary {
  uid: string;
  displayName: string;
  institution?: string;
  department?: string;
  photoURL?: string;
}

export const mentorService = {
  async listTeachers(): Promise<TeacherSummary[]> {
    const snap = await withTimeout(getDocs(query(collection(db, "users"), where("role", "==", "teacher"))));
    return snap.docs
      .map((d) => {
        const u = d.data() as UserProfile;
        return { uid: d.id, displayName: u.displayName || "Teacher", institution: u.institution, department: u.department, photoURL: u.photoURL };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },

  async getMentor(studentUid: string): Promise<{ mentorId: string; mentorName: string } | null> {
    const snap = await withTimeout(getDoc(doc(db, "users", studentUid)));
    const u = snap.exists() ? (snap.data() as UserProfile) : null;
    return u?.mentorId ? { mentorId: u.mentorId, mentorName: u.mentorName || "Your mentor" } : null;
  },

  async setMentor(studentUid: string, teacher: TeacherSummary | null): Promise<void> {
    await withTimeout(
      setDoc(
        doc(db, "users", studentUid),
        { mentorId: teacher?.uid ?? null, mentorName: teacher?.displayName ?? null, mentorUpdatedAt: new Date().toISOString() },
        { merge: true }
      )
    );
  },

  /** Students who chose this teacher as their mentor, plus all database registered students for analysis. */
  async listMentees(teacherUid?: string): Promise<UserProfile[]> {
    try {
      // 1. Fetch specific mentees linked to this teacher if teacherUid provided
      let specificMentees: UserProfile[] = [];
      if (teacherUid) {
        const snap = await withTimeout(
          getDocs(query(collection(db, "users"), where("role", "==", "student"), where("mentorId", "==", teacherUid)))
        );
        specificMentees = snap.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id }));
      }

      // 2. Fetch all registered DB students in Firestore users collection
      const allStudentsSnap = await withTimeout(
        getDocs(query(collection(db, "users"), where("role", "==", "student")))
      );
      const allDbStudents = allStudentsSnap.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id }));

      // 3. Fallback: if role field is omitted on older user docs, fetch all non-teacher user docs
      let fallbackStudents: UserProfile[] = [];
      if (allDbStudents.length === 0) {
        const allUsersSnap = await withTimeout(getDocs(collection(db, "users")));
        fallbackStudents = allUsersSnap.docs
          .map((d) => ({ ...(d.data() as UserProfile), uid: d.id }))
          .filter((u) => u.role !== "teacher" && u.uid !== teacherUid);
      }

      // Combine specific mentees first, then all DB students, deduplicating by uid
      const studentMap = new Map<string, UserProfile>();
      specificMentees.forEach((s) => studentMap.set(s.uid, s));
      allDbStudents.forEach((s) => {
        if (!studentMap.has(s.uid)) studentMap.set(s.uid, s);
      });
      fallbackStudents.forEach((s) => {
        if (!studentMap.has(s.uid)) studentMap.set(s.uid, s);
      });

      return Array.from(studentMap.values());
    } catch (err) {
      console.warn("[mentorService] listMentees error, falling back to all Firestore users:", err);
      try {
        const snap = await withTimeout(getDocs(collection(db, "users")));
        return snap.docs
          .map((d) => ({ ...(d.data() as UserProfile), uid: d.id }))
          .filter((u) => u.role !== "teacher" && u.uid !== teacherUid);
      } catch (fallbackErr) {
        console.error("[mentorService] listMentees critical fallback failed:", fallbackErr);
        return [];
      }
    }
  },
};

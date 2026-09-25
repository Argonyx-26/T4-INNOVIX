import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { UserProfile, UserRole, AcademicTier } from "../types";

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  registerWithEmail: (
    email: string, 
    pass: string, 
    displayName: string, 
    role: UserRole, 
    tier?: AcademicTier
  ) => Promise<UserProfile>;
  loginWithGoogle: (intendedRole?: UserRole) => Promise<UserProfile>;
  loginDemo: (demoRole: UserRole) => Promise<UserProfile>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "eduvia_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Helper with strict timeout to prevent Firestore network hangs from blocking authentication
  const firestoreTimeout = <T,>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Firestore request timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  };

  // Helper to fetch or create user in Firestore with non-blocking resilience
  const syncUserWithFirestore = async (
    fbUser: FirebaseUser, 
    assignedRole?: UserRole, 
    extraData?: Partial<UserProfile>
  ): Promise<UserProfile> => {
    // 1. Immediately create guaranteed base profile from authenticated Firebase user
    const baseProfile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email || extraData?.email || "",
      displayName: fbUser.displayName || extraData?.displayName || (assignedRole === "teacher" ? "Prof. Educator" : "Eduvia Learner"),
      role: assignedRole || extraData?.role || (fbUser.email?.includes("prof") || fbUser.email?.includes("teacher") ? "teacher" : "student"),
      photoURL: fbUser.photoURL || extraData?.photoURL || "",
      institution: extraData?.institution || (assignedRole === "teacher" ? "Eduvia Faculty Institute" : "Eduvia Academy"),
      academicTier: extraData?.academicTier || "School (K-12)",
      department: extraData?.department || (assignedRole === "teacher" ? "Cognitive Pedagogies & AI" : ""),
      enrolledCourses: ["course-linear-equations", "course-quadratic-mastery"],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    // 2. Best-effort Firestore sync (timeout so auth never hangs)
    try {
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await firestoreTimeout(getDoc(userRef));

      if (userSnap && userSnap.exists()) {
        const data = userSnap.data();
        const mergedProfile: UserProfile = {
          ...baseProfile,
          ...data,
          uid: fbUser.uid,
          email: fbUser.email || data.email || baseProfile.email,
          displayName: fbUser.displayName || data.displayName || baseProfile.displayName,
          role: assignedRole || data.role || baseProfile.role,
          photoURL: fbUser.photoURL || data.photoURL || baseProfile.photoURL,
          institution: data.institution || baseProfile.institution,
          academicTier: data.academicTier || baseProfile.academicTier,
          department: data.department || baseProfile.department,
          enrolledCourses: data.enrolledCourses || baseProfile.enrolledCourses,
          lastLogin: new Date().toISOString(),
        };

        // Background update without blocking authentication return
        firestoreTimeout(updateDoc(userRef, { lastLogin: mergedProfile.lastLogin })).catch(() => {});
        return mergedProfile;
      } else {
        // Background write without blocking authentication return
        firestoreTimeout(setDoc(userRef, baseProfile)).catch(() => {});
        return baseProfile;
      }
    } catch (err) {
      console.warn("[AuthContext] Firestore sync skipped (offline or not yet provisioned):", err);
      return baseProfile;
    }
  };

  // Subscribe to Firebase Auth state
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const profile = await syncUserWithFirestore(firebaseUser);
          if (isMounted) {
            setUser(profile);
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
          }
        } else {
          // If no firebaseUser and no local demo user, clear
          if (isMounted) {
            const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                if (parsed.uid?.includes("demo")) {
                  setUser(parsed);
                } else {
                  setUser(null);
                  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
                }
              } catch {
                setUser(null);
                localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
              }
            } else {
              setUser(null);
            }
          }
        }
      } catch (e) {
        console.warn("[AuthContext] Error in onAuthStateChanged:", e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // 1. Email Login
  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await syncUserWithFirestore(cred.user);
      setUser(profile);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      return profile;
    } finally {
      setLoading(false);
    }
  };

  // 2. Email Registration
  const registerWithEmail = async (
    email: string, 
    pass: string, 
    displayName: string, 
    assignedRole: UserRole, 
    tier?: AcademicTier
  ): Promise<UserProfile> => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      const profile = await syncUserWithFirestore(cred.user, assignedRole, {
        displayName,
        academicTier: tier || "School (K-12)",
      });
      setUser(profile);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      return profile;
    } finally {
      setLoading(false);
    }
  };

  // 3. Google OAuth Login
  const loginWithGoogle = async (intendedRole?: UserRole): Promise<UserProfile> => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserWithFirestore(result.user, intendedRole);
      setUser(profile);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      return profile;
    } finally {
      setLoading(false);
    }
  };

  // 4. Instant Demo Login (for hassle-free assessment & reviewer testing)
  const loginDemo = async (demoRole: UserRole): Promise<UserProfile> => {
    setLoading(true);
    try {
      const isStudent = demoRole === "student";
      const demoProfile: UserProfile = {
        uid: isStudent ? "student_demo_01" : "teacher_demo_01",
        email: isStudent ? "aarav.sharma@eduvia.ai" : "prof.sen@eduvia.ai",
        displayName: isStudent ? "Aarav Sharma" : "Prof. Vikram Sen",
        role: demoRole,
        photoURL: isStudent 
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
        institution: isStudent ? "Delhi Public School (Class 9)" : "IIT Delhi / Cognitive AI Faculty",
        academicTier: isStudent ? "School (K-12)" : "Postgraduate (PG)",
        department: isStudent ? "Science & Mathematics" : "Mathematical Pedagogy & Machine Intelligence",
        enrolledCourses: ["course-linear-equations", "course-quadratic-mastery"],
        createdAt: "2026-01-15T09:00:00.000Z",
        lastLogin: new Date().toISOString(),
      };

      // Best-effort non-blocking write to Firestore to keep DB populated
      const userRef = doc(db, "users", demoProfile.uid);
      firestoreTimeout(setDoc(userRef, demoProfile, { merge: true }), 1000).catch(() => {});

      setUser(demoProfile);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoProfile));
      return demoProfile;
    } finally {
      setLoading(false);
    }
  };

  // 5. Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  // 6. Switch Role
  const switchRole = async (newRole: UserRole): Promise<void> => {
    if (!user) return;
    const updated: UserProfile = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));

    // Best-effort non-blocking update
    const userRef = doc(db, "users", user.uid);
    firestoreTimeout(updateDoc(userRef, { role: newRole }), 1000).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "student",
        loading,
        isAuthenticated: !!user,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginDemo,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

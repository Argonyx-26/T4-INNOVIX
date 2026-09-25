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

  // Helper to fetch or create user in Firestore
  const syncUserWithFirestore = async (
    fbUser: FirebaseUser, 
    assignedRole?: UserRole, 
    extraData?: Partial<UserProfile>
  ): Promise<UserProfile> => {
    try {
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || data.email || "",
          displayName: fbUser.displayName || data.displayName || "Eduvia Learner",
          role: assignedRole || data.role || "student",
          photoURL: fbUser.photoURL || data.photoURL || "",
          institution: data.institution || "Eduvia Academy",
          academicTier: data.academicTier || "School (K-12)",
          department: data.department || "",
          enrolledCourses: data.enrolledCourses || ["course-linear-equations"],
          createdAt: data.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        // Update lastLogin
        await updateDoc(userRef, { lastLogin: new Date().toISOString() });
        return profile;
      } else {
        // Create new document in Firestore DB
        const newProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || "",
          displayName: fbUser.displayName || extraData?.displayName || "Eduvia User",
          role: assignedRole || "student",
          photoURL: fbUser.photoURL || "",
          institution: extraData?.institution || "Eduvia Global Campus",
          academicTier: extraData?.academicTier || "School (K-12)",
          department: extraData?.department || (assignedRole === "teacher" ? "STEM & Computer Science" : ""),
          enrolledCourses: ["course-linear-equations"],
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };

        await setDoc(userRef, newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn("Firestore sync fallback to local profile:", err);
      // Fallback in case firestore is unreachable or rules restricted
      return {
        uid: fbUser.uid,
        email: fbUser.email || "",
        displayName: fbUser.displayName || extraData?.displayName || "Eduvia User",
        role: assignedRole || "student",
        photoURL: fbUser.photoURL || "",
        academicTier: "School (K-12)",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
    }
  };

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await syncUserWithFirestore(firebaseUser);
        setUser(profile);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      } else {
        // If no firebaseUser and no local demo user, clear
        if (!user || (!user.uid.startsWith("student_demo") && !user.uid.startsWith("teacher_demo"))) {
          setUser(null);
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
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

      // Best effort write to Firestore to keep DB populated
      try {
        const userRef = doc(db, "users", demoProfile.uid);
        await setDoc(userRef, demoProfile, { merge: true });
      } catch (e) {
        console.warn("Demo profile local fallback:", e);
      }

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

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { role: newRole });
    } catch (e) {
      console.warn("Could not persist role switch to Firestore:", e);
    }
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

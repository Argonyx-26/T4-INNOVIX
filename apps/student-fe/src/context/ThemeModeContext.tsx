import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { Course, ThemeMode, ToastMessage } from "../types";
import { useAuth } from "./AuthContext";
import { dataService } from "../services/dataService";

const GUEST_BOOKMARKS_KEY = "eduvia_guest_course_bookmarks";
const LEGACY_BOOKMARKS_KEY = "eduvia_bookmarks";
const userBookmarksCacheKey = (uid: string) => `eduvia_course_bookmarks_${uid}`;

const readStoredCourses = (key: string): Course[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c) => c && typeof c === "object" && c.id) : [];
  } catch {
    return [];
  }
};

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  speechEnabled: boolean;
  setSpeechEnabled: (val: boolean) => void;
  speak: (text: string) => void;
  stopSpeech: () => void;
  bookmarks: string[];
  savedCourses: Course[];
  toggleBookmark: (course: Course) => boolean;
  toast: ToastMessage | null;
  showToast: (title: string, description?: string, type?: "info" | "success" | "warning") => void;
  addToast: (t: { title: string; description?: string; type?: "info" | "success" | "warning" }) => void;
  dismissToast: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eduvia_theme_mode") as ThemeMode;
      if (saved && ["normal", "adhd", "dyslexic"].includes(saved)) {
        return saved;
      }
    }
    return "normal";
  });

  const [speechEnabled, setSpeechEnabled] = useState(true);
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [savedCourses, setSavedCourses] = useState<Course[]>(() => readStoredCourses(GUEST_BOOKMARKS_KEY));
  const savedCoursesRef = useRef<Course[]>(savedCourses);
  const commitSavedCourses = (next: Course[]) => {
    savedCoursesRef.current = next;
    setSavedCourses(next);
  };
  const bookmarks = useMemo(() => savedCourses.map((c) => c.id), [savedCourses]);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Load the signed-in user's bookmarks from Firestore, folding in anything saved while logged out.
  useEffect(() => {
    localStorage.removeItem(LEGACY_BOOKMARKS_KEY);

    if (!uid) {
      commitSavedCourses(readStoredCourses(GUEST_BOOKMARKS_KEY));
      return;
    }

    let cancelled = false;
    commitSavedCourses(readStoredCourses(userBookmarksCacheKey(uid)));

    (async () => {
      const guest = readStoredCourses(GUEST_BOOKMARKS_KEY);
      try {
        const remote = await dataService.getCourseBookmarks(uid);
        const merged = [...remote, ...guest.filter((g) => !remote.some((r) => r.id === g.id))];
        if (guest.length > 0) {
          await dataService.saveCourseBookmarks(uid, merged);
          localStorage.removeItem(GUEST_BOOKMARKS_KEY);
        }
        if (cancelled) return;
        commitSavedCourses(merged);
        localStorage.setItem(userBookmarksCacheKey(uid), JSON.stringify(merged));
      } catch (err) {
        console.warn("[Bookmarks] Could not load saved courses from the database; using local cache.", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Sync mode with document body class
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.remove("mode-adhd", "mode-dyslexic");
      if (mode === "adhd") {
        document.body.classList.add("mode-adhd");
      } else if (mode === "dyslexic") {
        document.body.classList.add("mode-dyslexic");
      }
      localStorage.setItem("eduvia_theme_mode", mode);
    }
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    showToast(
      `Mode Switched: ${newMode.toUpperCase()}`,
      newMode === "adhd"
        ? "ADHD Focus Mode: Minimal cognitive load, warm cream background, high-focus styling."
        : newMode === "dyslexic"
        ? "Dyslexia Mode Active: OpenDyslexic weighted typography, reading ruler, and audio assists enabled."
        : "Standard Editorial Experience restored.",
      "info"
    );
  };

  const toggleBookmark = (course: Course): boolean => {
    const prev = savedCoursesRef.current;
    const wasSaved = prev.some((c) => c.id === course.id);
    const next = wasSaved ? prev.filter((c) => c.id !== course.id) : [...prev, course];
    commitSavedCourses(next);

    if (!uid) {
      localStorage.setItem(GUEST_BOOKMARKS_KEY, JSON.stringify(next));
      showToast(
        wasSaved ? "Bookmark Removed" : "Saved on This Device",
        wasSaved ? `"${course.title}" was removed.` : "Log in to keep your saved courses in your account.",
        wasSaved ? "info" : "success"
      );
      return !wasSaved;
    }

    localStorage.setItem(userBookmarksCacheKey(uid), JSON.stringify(next));
    dataService
      .saveCourseBookmarks(uid, next)
      .then(() => {
        showToast(
          wasSaved ? "Bookmark Removed" : "Bookmarked!",
          wasSaved ? `"${course.title}" was removed from your saved courses.` : `"${course.title}" is saved to your account.`,
          wasSaved ? "info" : "success"
        );
      })
      .catch((err) => {
        console.warn("[Bookmarks] Failed to save to the database:", err);
        // Roll back only if no newer toggle has happened since.
        if (savedCoursesRef.current === next) {
          commitSavedCourses(prev);
          localStorage.setItem(userBookmarksCacheKey(uid), JSON.stringify(prev));
        }
        showToast("Couldn't Save Bookmark", "We couldn't reach the database. Please try again.", "warning");
      });
    return !wasSaved;
  };

  const speak = (text: string) => {
    if (!speechEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = mode === "dyslexic" ? 0.9 : 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const showToast = (title: string, description?: string, type: "info" | "success" | "warning" = "info") => {
    const id = Date.now().toString();
    setToast({ id, title, description, type });
  };

  const addToast = (t: { title: string; description?: string; type?: "info" | "success" | "warning" }) => {
    showToast(t.title, t.description, t.type || "info");
  };

  const dismissToast = () => {
    setToast(null);
  };

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        speechEnabled,
        setSpeechEnabled,
        speak,
        stopSpeech,
        bookmarks,
        savedCourses,
        toggleBookmark,
        toast,
        showToast,
        addToast,
        dismissToast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return context;
};

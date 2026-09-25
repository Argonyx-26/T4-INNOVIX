import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeMode, ToastMessage } from "../types";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  speechEnabled: boolean;
  setSpeechEnabled: (val: boolean) => void;
  speak: (text: string) => void;
  stopSpeech: () => void;
  bookmarks: string[];
  toggleBookmark: (courseId: string) => boolean;
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
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eduvia_bookmarks");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return ["course-linear-equations"];
  });

  const [toast, setToast] = useState<ToastMessage | null>(null);

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

  const toggleBookmark = (courseId: string): boolean => {
    let next: string[];
    let isBookmarkedNow = false;
    if (bookmarks.includes(courseId)) {
      next = bookmarks.filter((id) => id !== courseId);
      showToast("Bookmark Removed", "Course removed from your personal study planner.", "info");
    } else {
      next = [...bookmarks, courseId];
      isBookmarkedNow = true;
      showToast("Bookmarked!", "Saved to your study queue for quick offline reference.", "success");
    }
    setBookmarks(next);
    localStorage.setItem("eduvia_bookmarks", JSON.stringify(next));
    return isBookmarkedNow;
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

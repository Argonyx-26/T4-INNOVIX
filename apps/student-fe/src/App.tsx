import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { StudentShell } from "./components/StudentShell";
import { ModeToggleWidget } from "./components/ModeToggleWidget";
import { ReadingRuler } from "./components/ReadingRuler";
import { LandingPage } from "./pages/LandingPage";
import { LearnLensDiagnostic } from "./pages/LearnLensDiagnostic";
import { CourseGrid } from "./pages/CourseGrid";
import { AdaptivePacing } from "./pages/AdaptivePacing";
import { LearningPath } from "./pages/LearningPath";
import { Instructors } from "./pages/Instructors";
import { TeacherInsightsView } from "./pages/TeacherInsightsView";
import { EducationalResourceLibrary } from "./pages/EducationalResourceLibrary";
import { StudentDashboard } from "./pages/StudentDashboard";
import { MisconceptionCenter } from "./pages/MisconceptionCenter";
import { DiagnosticReport } from "./pages/DiagnosticReport";
import { StudyPlan } from "./pages/StudyPlan";
import { StudentSettings } from "./pages/StudentSettings";
import { SelfStudy } from "./pages/SelfStudy";
import { AITutor } from "./pages/AITutor";
import { VoiceAssistantModal } from "./components/modals/VoiceAssistantModal";
import { SearchModal } from "./components/modals/SearchModal";
import { CourseModal } from "./components/modals/CourseModal";
import { LoginModal } from "./components/modals/LoginModal";
import { useThemeMode } from "./context/ThemeModeContext";
import { useAuth } from "./context/AuthContext";
import { Course } from "./types";
import { Info, CheckCircle2, AlertTriangle, X } from "lucide-react";

export const App: React.FC = () => {
  const { toast, dismissToast } = useThemeMode();
  const { isAuthenticated, role } = useAuth();
  const isStudentShell = isAuthenticated && role === "student";

  // Route State via Hash
  const [currentHash, setCurrentHash] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.hash || "#home";
    }
    return "#home";
  });

  // Modals state
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Sync with Hash Changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#home";
      setCurrentHash(hash);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Global hotkeys (Cmd+K / Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
  };

  // Render the active view based on currentHash
  const renderActiveView = () => {
    switch (currentHash) {
      case "#student":
        return <StudentDashboard onNavigate={navigateTo} />;
      case "#diagnostic":
        return <LearnLensDiagnostic />;
      case "#diagnostic-results":
        return <DiagnosticReport onNavigate={navigateTo} />;
      case "#misconceptions":
        return <MisconceptionCenter onNavigate={navigateTo} />;
      case "#plan":
        return <StudyPlan onNavigate={navigateTo} />;
      case "#courses":
        return <CourseGrid onSelectCourse={setSelectedCourse} />;
      case "#pacing":
        return <AdaptivePacing />;
      case "#paths":
        return <LearningPath />;
      case "#mentors":
        return <Instructors />;
      case "#library":
        return <EducationalResourceLibrary />;
      case "#settings":
        return <StudentSettings />;
      case "#ai-tutor":
        return <AITutor />;
      case "#self-study":
        return <SelfStudy />;
      case "#teacher":
        return <TeacherInsightsView initialTab="overview" />;
      case "#teacher-triage":
        return <TeacherInsightsView initialTab="kanban" />;
      case "#teacher-students":
        return <TeacherInsightsView initialTab="comparison" />;
      case "#teacher-analytics":
        return <TeacherInsightsView initialTab="analytics" />;
      case "#teacher-interventions":
        return <TeacherInsightsView initialTab="pods" />;
      case "#teacher-intelligence":
        return <TeacherInsightsView initialTab="rag-chatbot" />;
      case "#home":
      default:
        if (isAuthenticated) {
          if (role === "teacher") {
            return <TeacherInsightsView initialTab="overview" />;
          } else {
            return <StudentDashboard onNavigate={navigateTo} />;
          }
        }
        return <LandingPage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-[#8266F0] selection:text-white">
      {/* Dyslexia Interactive Reading Ruler (z-35) */}
      <ReadingRuler />

      {isStudentShell ? (
        <StudentShell
          activeHash={currentHash}
          onNavigate={navigateTo}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenVoice={() => setVoiceModalOpen(true)}
        >
          {renderActiveView()}
        </StudentShell>
      ) : (
        <>
          <Navbar
            activeHash={currentHash}
            onOpenVoice={() => setVoiceModalOpen(true)}
            onOpenSearch={() => setSearchModalOpen(true)}
            onOpenLogin={() => setLoginModalOpen(true)}
          />
          <main className="flex-1">{renderActiveView()}</main>
        </>
      )}

      {/* Students switch modes from the account menu; visitors from the header. */}
      {isAuthenticated && !isStudentShell && <ModeToggleWidget />}

      {/* Global Toast Alert Notification (z-[90]) */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-6 z-[90] max-w-sm w-full bg-white dark:bg-[#1E1E24] rounded-2xl p-4 shadow-2xl border border-black/10 dark:border-white/10 flex items-start space-x-3 animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : toast.type === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <Info className="w-5 h-5 text-[#8266F0]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              {toast.title}
            </h4>
            {toast.description && (
              <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={dismissToast}
            aria-label="Dismiss Notification"
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Interactive Modals (z-[100]) */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onNavigate={navigateTo}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectCourse={setSelectedCourse}
        onNavigate={navigateTo}
      />

      <CourseModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  );
};

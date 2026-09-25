import React, { useState, useEffect } from "react";
import { 
  X, 
  User, 
  Lock, 
  Sparkles, 
  GraduationCap, 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  Check, 
  AlertCircle,
  Briefcase,
  Building
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useThemeMode } from "../../context/ThemeModeContext";
import { UserRole, AcademicTier } from "../../types";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    role: currentRole, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    loginDemo, 
    logout 
  } = useAuth();
  const { showToast } = useThemeMode();

  // Mode: "login" vs "signup"
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  
  // Selected Role for Sign Up / OAuth
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [academicTier, setAcademicTier] = useState<AcademicTier>("School (K-12)");
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset form errors on open or tab switch
  useEffect(() => {
    setErrorMessage(null);
  }, [authMode, isOpen]);

  if (!isOpen) return null;

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const loggedUser = await loginWithGoogle(selectedRole);
      showToast(
        "Google Sign-In Successful",
        `Welcome, ${loggedUser.displayName || loggedUser.email}! Authenticated as ${loggedUser.role === "teacher" ? "Faculty" : "Student"}.`,
        "success"
      );
      onClose();
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMessage("Google Sign-In popup was closed before completing.");
      } else {
        setErrorMessage(err.message || "Failed to sign in with Google OAuth.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email Submission (Login or Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (authMode === "login") {
        const loggedUser = await loginWithEmail(email, password);
        showToast(
          "Logged In Successfully",
          `Welcome back, ${loggedUser.displayName}! Synced as ${loggedUser.role === "teacher" ? "Faculty / Teacher" : "Student"}.`,
          "success"
        );
        onClose();
      } else {
        // Sign Up
        if (!name.trim()) {
          setErrorMessage("Please enter your name.");
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage("Password must be at least 6 characters.");
          setIsLoading(false);
          return;
        }

        const newUser = await registerWithEmail(email, password, name, selectedRole, academicTier);
        showToast(
          "Account Created Successfully",
          `Welcome to Eduvia, ${newUser.displayName}! Your ${selectedRole} profile has been initialized in Firestore DB.`,
          "success"
        );
        onClose();
      }
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setErrorMessage("Invalid email or password. Please check your credentials or try Demo Login below.");
      } else if (err.code === "auth/email-already-in-use") {
        setErrorMessage("An account with this email already exists. Please switch to Log In.");
      } else if (err.code === "auth/weak-password") {
        setErrorMessage("Password is too weak. Please use at least 6 characters.");
      } else {
        setErrorMessage(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 1-Click Demo Login
  const handleQuickDemo = async (roleToLogin: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const demoUser = await loginDemo(roleToLogin);
      showToast(
        "Demo Session Active",
        `Logged in as ${demoUser.displayName} (${roleToLogin === "teacher" ? "Faculty / Teacher" : "Class 9 Student"}). Telemetry synced to Firestore.`,
        "success"
      );
      onClose();
    } catch (err: any) {
      setErrorMessage("Could not launch demo session. " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1E1E24] rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden transform animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8266F0] to-[#EC4899] text-white shadow-md shadow-[#8266F0]/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-[#141414] dark:text-white">
                {user ? "Your Eduvia Profile" : authMode === "login" ? "Welcome Back to Eduvia" : "Create Eduvia Account"}
              </h3>
              <p className="text-xs text-[#6B6B6B] dark:text-slate-400">
                {user ? "Authenticated with Firebase & Firestore DB" : "Cognitive Telemetry & Role Authentication"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-[#141414] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Already Logged In: Show Profile Card */}
        {user ? (
          <div className="py-6 space-y-6">
            <div className="p-5 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center space-x-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#8266F0]"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#8266F0]/15 text-[#8266F0] flex items-center justify-center font-bold text-2xl font-display">
                  {user.displayName?.charAt(0) || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-base text-[#141414] dark:text-white truncate">
                    {user.displayName}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    user.role === "teacher" 
                      ? "bg-[#EC4899]/15 text-[#EC4899]" 
                      : "bg-[#8266F0]/15 text-[#8266F0]"
                  }`}>
                    {user.role === "teacher" ? "Faculty" : "Student"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 truncate mt-0.5">{user.email}</p>
                {user.institution && (
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">{user.institution}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={user.role === "teacher" ? "#teacher" : "#diagnostic"}
                onClick={onClose}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-center hover:opacity-90 transition shadow-sm"
              >
                {user.role === "teacher" ? "Open Teacher RAG Suite" : "Go to Diagnostic Loop"}
              </a>

              <button
                onClick={() => {
                  logout();
                  showToast("Signed Out", "You have been logged out of Eduvia.", "info");
                  onClose();
                }}
                className="py-3 px-4 rounded-xl font-semibold text-xs border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-center transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-5">
            {/* Mode Switcher Tabs (Login vs Sign Up) */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                  authMode === "login"
                    ? "bg-white dark:bg-[#25252D] text-[#141414] dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                  authMode === "signup"
                    ? "bg-white dark:bg-[#25252D] text-[#141414] dark:text-white shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Role Selection Segment (Student vs Teacher) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Select Your Role:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole("student")}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex items-start space-x-3 ${
                    selectedRole === "student"
                      ? "bg-[#8266F0]/10 border-[#8266F0] text-neutral-900 dark:text-white shadow-sm"
                      : "bg-neutral-50 dark:bg-white/5 border-transparent text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    selectedRole === "student" ? "bg-[#8266F0] text-white" : "bg-neutral-200 dark:bg-white/10"
                  }`}>
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">🎓 Student</div>
                    <p className="text-[10px] text-neutral-500 leading-snug mt-0.5">
                      Diagnostic loop, scaffolded hints &amp; mind maps
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("teacher")}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex items-start space-x-3 ${
                    selectedRole === "teacher"
                      ? "bg-[#EC4899]/10 border-[#EC4899] text-neutral-900 dark:text-white shadow-sm"
                      : "bg-neutral-50 dark:bg-white/5 border-transparent text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    selectedRole === "teacher" ? "bg-[#EC4899] text-white" : "bg-neutral-200 dark:bg-white/10"
                  }`}>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">👩‍🏫 Teacher / Faculty</div>
                    <p className="text-[10px] text-neutral-500 leading-snug mt-0.5">
                      RAG Vector chatbot, cohort heatmaps &amp; pods
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Google OAuth Button */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200 font-bold text-xs sm:text-sm flex items-center justify-center space-x-3 transition shadow-sm active:scale-98"
              >
                {/* Google SVG Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/10 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-neutral-400">
                  <span className="bg-white dark:bg-[#1E1E24] px-3">or continue with email</span>
                </div>
              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start space-x-2.5 text-xs text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      required
                      placeholder={selectedRole === "teacher" ? "Prof. Vikram Sen" : "Aarav Sharma"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
                    />
                  </div>
                </div>
              )}

              {authMode === "signup" && selectedRole === "student" && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Academic Tier
                  </label>
                  <select
                    value={academicTier}
                    onChange={(e) => setAcademicTier(e.target.value as AcademicTier)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
                  >
                    <option value="School (K-12)">School Education (Class 8–12)</option>
                    <option value="Undergraduate (UG)">Undergraduate (B.Tech / MBBS / B.Com)</option>
                    <option value="Postgraduate (PG)">Postgraduate (M.Tech / MBA / Ph.D.)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    placeholder={selectedRole === "teacher" ? "prof.sen@eduvia.ai" : "aarav@eduvia.ai"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#111111] dark:bg-white dark:text-[#111111] hover:opacity-90 shadow-md transition flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? "Authenticating..." : authMode === "login" ? `Log In as ${selectedRole === "teacher" ? "Teacher" : "Student"}` : `Sign Up as ${selectedRole === "teacher" ? "Teacher" : "Student"}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Pre-fills for Testing & Assessment */}
            <div className="pt-3 border-t border-black/5 dark:border-white/10">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2 text-center">
                Instant 1-Click Demo Evaluation Accounts
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("student")}
                  disabled={isLoading}
                  className="py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-[#8266F0]/15 hover:text-[#8266F0] text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-transparent hover:border-[#8266F0]/30"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Demo Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo("teacher")}
                  disabled={isLoading}
                  className="py-2 px-3 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-[#EC4899]/15 hover:text-[#EC4899] text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-transparent hover:border-[#EC4899]/30"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Demo Teacher</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

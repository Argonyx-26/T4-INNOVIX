import React, { useState, useEffect } from "react";
import { 
  X, 
  User, 
  Lock, 
  Sparkles, 
  GraduationCap, 
  Mail, 
  ArrowRight, 
  AlertCircle,
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle2,
  BookOpen,
  BarChart2,
  Lightbulb
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useThemeMode } from "../../context/ThemeModeContext";
import { UserRole, AcademicTier } from "../../types";
import { Avatar } from "../AppShell";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    loginDemo, 
    logout 
  } = useAuth();
  const { showToast } = useThemeMode();

  // Mode: "login" vs "signup"
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  
  // Selected Role: "student" vs "teacher"
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  
  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [academicTier, setAcademicTier] = useState<AcademicTier>("School (K-12)");
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{
    text: string;
    actionText?: string;
    onAction?: () => void;
  } | null>(null);

  // Keyboard shortcut listener (ESC to close modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset form errors when switching tabs or closing
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
      console.error("[LoginModal] Google Auth Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMessage({
          text: "Google Sign-In popup was closed. Please try again.",
        });
      } else if (err.code === "auth/popup-blocked") {
        setErrorMessage({
          text: "Pop-up window was blocked by your browser. Please allow popups or use Email/Demo login below.",
        });
      } else if (err.code === "auth/unauthorized-domain") {
        const currentHost = window.location.hostname || "localhost";
        setErrorMessage({
          text: `Domain '${currentHost}' is not in Firebase Authorized Domains. In Firebase Console > Auth > Authorized Domains, add '${currentHost}'.`,
        });
      } else {
        setErrorMessage({
          text: err.message || "Failed to sign in with Google OAuth.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Form Submission (Email/Password Login or Registration)
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
          setErrorMessage({ text: "Please enter your full name." });
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage({ text: "Password must be at least 6 characters long." });
          setIsLoading(false);
          return;
        }

        const newUser = await registerWithEmail(email, password, name, selectedRole, academicTier);
        showToast(
          "Account Created Successfully",
          `Welcome to Eduvia, ${newUser.displayName}! Your ${selectedRole} profile has been created.`,
          "success"
        );
        onClose();
      }
    } catch (err: any) {
      console.error("[LoginModal] Email Auth Error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setErrorMessage({
          text: "Invalid email or password. If you don't have an account yet, click Create Account above.",
          actionText: "Switch to Create Account",
          onAction: () => setAuthMode("signup"),
        });
      } else if (err.code === "auth/email-already-in-use") {
        setErrorMessage({
          text: "An account with this email already exists.",
          actionText: "Switch to Log In",
          onAction: () => setAuthMode("login"),
        });
      } else if (err.code === "auth/weak-password") {
        setErrorMessage({ text: "Password is too weak. Please use at least 6 characters." });
      } else if (err.code === "auth/invalid-email") {
        setErrorMessage({ text: "Please enter a valid email address." });
      } else {
        setErrorMessage({ text: err.message || "Authentication failed. Please try again." });
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
        `Logged in as ${demoUser.displayName} (${roleToLogin === "teacher" ? "Faculty / Teacher" : "Class 9 Student"}). Telemetry synced.`,
        "success"
      );
      onClose();
    } catch (err: any) {
      setErrorMessage({ text: "Could not launch demo session. " + err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Outer Floating Organic Blobs Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#EBF7F2] via-[#FFFDF7] to-[#F4F0FF] blur-3xl opacity-80" />
      </div>

      {/* Main Split Modal Container */}
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-[#1A1A20] rounded-[32px] shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden transform animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Hero Illustration & Brand Panel                              */}
        {/* ========================================================================= */}
        <div className="w-full md:w-[46%] bg-[#FAF8F5] dark:bg-[#22222A] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-black/5 dark:border-white/5">
          {/* Subtle Organic Curved Background Accent */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-[#FFEFA6]/40 blur-2xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#00B67A]/10 blur-3xl" />

          {/* Eduvia Brand Logo */}
          <div className="relative z-10">
            <div className="inline-block">
              <span className="font-display text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                Eduvia
              </span>
              <div className="h-1.5 w-10 bg-[#FFE066] rounded-full mt-0.5" />
            </div>
          </div>

          {/* Central Hero Graphic (Kid Illustration) */}
          <div className="relative z-10 my-4 sm:my-6 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[300px] sm:max-w-[340px] flex items-center justify-center">
              <img
                src="/login-theme-hero.png"
                alt="Eduvia Student Learning Illustration"
                className="w-full h-auto object-contain drop-shadow-sm transition-transform hover:scale-[1.02] duration-300"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </div>

          {/* Left Footer Subtitle */}
          <div className="relative z-10 text-center md:text-left">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">
              Cognitive Diagnostic &amp; Scaffolding Platform for Students &amp; Faculty.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Auth Form & Controls                                        */}
        {/* ========================================================================= */}
        <div className="w-full md:w-[54%] bg-white dark:bg-[#1A1A20] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto relative">
          {/* Modal Close Button (Top Right) */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-500 dark:text-neutral-300 grid place-items-center transition z-20"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {user ? (
            /* Logged-In User State */
            <div className="py-6 space-y-6">
              <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center space-x-4">
                <Avatar name={user.displayName} photoURL={user.photoURL} className="w-16 h-16 text-2xl ring-2 ring-brand" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-base text-neutral-900 dark:text-white truncate">
                      {user.displayName}
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.role === "teacher" 
                        ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" 
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
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
                  href={user.role === "teacher" ? "#teacher" : "#student"}
                  onClick={onClose}
                  className="py-3.5 px-4 rounded-full font-bold text-xs bg-[#18181B] text-white dark:bg-white dark:text-[#18181B] text-center hover:opacity-90 transition shadow-sm"
                >
                  {user.role === "teacher" ? "Open Teacher Portal" : "Go to Dashboard"}
                </a>

                <button
                  onClick={() => {
                    logout();
                    showToast("Signed Out", "You have been logged out of Eduvia.", "info");
                    onClose();
                  }}
                  className="py-3.5 px-4 rounded-full font-semibold text-xs border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-center transition"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Auth Form (Log In / Create Account) */
            <div className="space-y-4 pt-2">
              {/* Mode Switcher Pills (Log In vs Create Account) */}
              <div className="w-full p-1 rounded-full bg-[#F3F3F5] dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all text-center ${
                    authMode === "login"
                      ? "bg-[#18181B] text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`flex-1 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all text-center ${
                    authMode === "signup"
                      ? "bg-[#18181B] text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Role Selection Segment */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                  Select your role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Student Role Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("student")}
                    className={`p-3 rounded-2xl border transition-all text-left flex items-center space-x-3 ${
                      selectedRole === "student"
                        ? "border-brand bg-[#F5F2FF] dark:bg-brand/15 text-neutral-900 dark:text-white ring-2 ring-brand/20"
                        : "border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedRole === "student"
                        ? "bg-brand text-white"
                        : "bg-neutral-200/80 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
                    }`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate">Student</div>
                      <div className="text-[10px] text-neutral-500 truncate">Learner Account</div>
                    </div>
                  </button>

                  {/* Teacher Role Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("teacher")}
                    className={`p-3 rounded-2xl border transition-all text-left flex items-center space-x-3 ${
                      selectedRole === "teacher"
                        ? "border-[#EC4899] bg-[#FDF2F8] dark:bg-[#EC4899]/15 text-neutral-900 dark:text-white ring-2 ring-[#EC4899]/20"
                        : "border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedRole === "teacher"
                        ? "bg-[#EC4899] text-white"
                        : "bg-neutral-200/80 dark:bg-white/10 text-neutral-600 dark:text-neutral-300"
                    }`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate">Teacher</div>
                      <div className="text-[10px] text-neutral-500 truncate">Faculty Account</div>
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
                  className="w-full py-3 px-4 rounded-full border border-neutral-200/90 dark:border-neutral-700 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 font-semibold text-xs sm:text-sm flex items-center justify-center space-x-3 transition shadow-sm active:scale-[0.99]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

                {/* OR Divider */}
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200 dark:border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-neutral-400">
                    <span className="bg-white dark:bg-[#1A1A20] px-3">OR</span>
                  </div>
                </div>
              </div>

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col space-y-1.5 text-xs text-rose-700 dark:text-rose-400">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span className="leading-tight flex-1">{errorMessage.text}</span>
                  </div>
                  {errorMessage.actionText && errorMessage.onAction && (
                    <button
                      type="button"
                      onClick={errorMessage.onAction}
                      className="self-start ml-6 px-2.5 py-0.5 rounded-lg bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 transition"
                    >
                      <span className="inline-flex items-center gap-1">{errorMessage.actionText} <ArrowRight className="w-3 h-3" /></span>
                    </button>
                  )}
                </div>
              )}

              {/* Form Input Fields */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
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
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F9F9FA] dark:bg-white/5 border border-neutral-200/90 dark:border-white/10 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      />
                    </div>
                  </div>
                )}

                {authMode === "signup" && selectedRole === "student" && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Academic Tier
                    </label>
                    <select
                      value={academicTier}
                      onChange={(e) => setAcademicTier(e.target.value as AcademicTier)}
                      className="w-full px-3.5 py-3 rounded-2xl bg-[#F9F9FA] dark:bg-white/5 border border-neutral-200/90 dark:border-white/10 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    >
                      <option value="School (K-12)">School Education (Class 8–12)</option>
                      <option value="Undergraduate (UG)">Undergraduate (B.Tech / MBBS / B.Com)</option>
                      <option value="Postgraduate (PG)">Postgraduate (M.Tech / MBA / Ph.D.)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="sr-only">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#F9F9FA] dark:bg-white/5 border border-neutral-200/90 dark:border-white/10 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="sr-only">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-[#F9F9FA] dark:bg-white/5 border border-neutral-200/90 dark:border-white/10 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-full font-semibold text-xs sm:text-sm text-white bg-[#18181B] dark:bg-white dark:text-[#18181B] hover:bg-black dark:hover:bg-neutral-100 transition flex items-center justify-center space-x-2 shadow-lg shadow-black/10 active:scale-[0.99] mt-2"
                >
                  <span>
                    {isLoading 
                      ? "Authenticating..." 
                      : authMode === "login" 
                        ? `Log In` 
                        : `Create Account`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo Pre-fills for 1-Click Evaluation */}
              <div className="pt-2 border-t border-neutral-100 dark:border-white/10">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo("student")}
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-full bg-neutral-100/80 dark:bg-white/5 hover:bg-brand/15 hover:text-brand text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-transparent hover:border-brand/30"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Demo Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo("teacher")}
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-full bg-neutral-100/80 dark:bg-white/5 hover:bg-[#EC4899]/15 hover:text-[#EC4899] text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-transparent hover:border-[#EC4899]/30"
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
    </div>
  );
};

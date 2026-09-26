import React, { useState, useRef, useEffect } from "react";
import { Search, Menu, X, BookOpenCheck, ChevronDown, Eye, Zap, Check } from "lucide-react";
import { useThemeMode } from "../context/ThemeModeContext";

/** Public header for visitors. Signed-in users get the sidebar shell (AppShell) instead. */
interface NavbarProps {
  activeHash: string;
  onOpenSearch: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeHash, onOpenSearch, onOpenLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { mode, setMode } = useThemeMode();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [activeHash]);

  const toggleDropdown = (name: string) => setActiveDropdown((prev) => (prev === name ? null : name));
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const scroll = () =>
      id === "top"
        ? window.scrollTo({ top: 0, behavior: "smooth" })
        : document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (activeHash !== "#home") {
      window.location.hash = "#home";
      // App scrolls to top on hashchange; wait for the landing page to mount first.
      setTimeout(scroll, 350);
    } else {
      scroll();
    }
  };

  const publicLinks = [
    { label: "Home", section: "top" },
    { label: "Features", section: "features" },
    { label: "How It Works", section: "how-it-works" },
  ];

  const goToCourses = () => {
    setMobileMenuOpen(false);
    window.location.hash = "#courses";
  };

  const modeOptions = [
    { id: "normal" as const, label: "Standard", icon: Eye },
    { id: "adhd" as const, label: "ADHD Focus", icon: Zap },
    { id: "dyslexic" as const, label: "Dyslexic", icon: BookOpenCheck },
  ];
  const activeMode = modeOptions.find((m) => m.id === mode) ?? modeOptions[0];
  // The dyslexic font is much wider, so the inline links need more room before they fit.
  const wideFont = mode === "dyslexic";

  const linkClass = (active: boolean) =>
    `text-[15px] transition-colors ${active ? "font-bold text-[#0B0B0B]" : "font-medium text-[#2B2B2B] hover:text-[#1BBC7E]"}`;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F8F8F7] site-header" ref={dropdownRef}>
      <div className="mx-auto max-w-[1672px] h-20 px-5 sm:px-8 lg:px-[5.08%] flex items-center justify-between gap-6">
        <a href="#home" className="flex items-center gap-2.5 shrink-0" aria-label="Eduvia home">
          <img src="/eduvia-mark.png" alt="" className="w-8 h-9 object-contain" />
          <span className="font-sans font-bold text-[27px] tracking-[-0.02em] text-[#0B0B0B]">Eduvia</span>
        </a>

        <nav className={`hidden items-center gap-6 xl:gap-10 whitespace-nowrap ${wideFont ? "xl:flex" : "lg:flex"}`} aria-label="Primary">
          {publicLinks.map((link, i) => (
            <button
              key={link.section}
              onClick={() => scrollToSection(link.section)}
              className={linkClass(i === 0 && activeHash === "#home")}
            >
              {link.label}
            </button>
          ))}
          <button onClick={goToCourses} className={linkClass(activeHash === "#courses")}>
            Courses
          </button>
          <button onClick={onOpenLogin} className={linkClass(false)}>
            For Educators
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden sm:block">
            <button
              onClick={() => toggleDropdown("modes")}
              aria-haspopup="menu"
              aria-expanded={activeDropdown === "modes"}
              aria-label={`Reading mode: ${activeMode.label}`}
              className="h-10 px-3 rounded-full border-[1.5px] border-[#0B0B0B]/15 hover:border-[#0B0B0B] text-[#0B0B0B] text-sm font-semibold flex items-center gap-1.5 transition"
            >
              <activeMode.icon className="w-4 h-4" />
              <span className="hidden xl:inline">{activeMode.label}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {activeDropdown === "modes" && (
              <div role="menu" className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white border border-black/10 shadow-xl p-1.5 z-50">
                {modeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    role="menuitemradio"
                    aria-checked={mode === opt.id}
                    onClick={() => {
                      setMode(opt.id);
                      setActiveDropdown(null);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-left text-sm flex items-center gap-2.5 transition ${
                      mode === opt.id ? "bg-[#1BBC7E]/15 font-bold text-[#0B0B0B]" : "font-medium text-[#2B2B2B] hover:bg-black/5"
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                    <span className="flex-1">{opt.label}</span>
                    {mode === opt.id && <Check className="w-4 h-4 text-[#1BBC7E]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onOpenSearch}
            aria-label="Search (Ctrl+K)"
            className="hidden sm:inline-flex p-2 rounded-full text-[#0B0B0B] hover:bg-black/5 transition"
          >
            <Search className="w-6 h-6" strokeWidth={1.75} />
          </button>
          <button
            onClick={onOpenLogin}
            className="h-11 px-5 sm:px-7 whitespace-nowrap rounded-full bg-[#1BBC7E] text-[#0B0B0B] text-sm font-bold border-[1.5px] border-[#0B0B0B] shadow-[0_3px_0_#0B0B0B] hover:translate-y-[1px] hover:shadow-[0_2px_0_#0B0B0B] active:translate-y-[3px] active:shadow-none transition"
          >
            Log in
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
            className={`p-2 rounded-full text-[#0B0B0B] hover:bg-black/5 transition ${wideFont ? "xl:hidden" : "lg:hidden"}`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className={`border-t border-black/5 bg-[#F8F8F7] px-5 sm:px-8 py-3 flex flex-col ${wideFont ? "xl:hidden" : "lg:hidden"}`} aria-label="Primary">
          {publicLinks.map((link) => (
            <button
              key={link.section}
              onClick={() => scrollToSection(link.section)}
              className="py-3 text-left text-base font-medium text-[#0B0B0B]"
            >
              {link.label}
            </button>
          ))}
          <button onClick={goToCourses} className="py-3 text-left text-base font-medium text-[#0B0B0B]">
            Courses
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenSearch();
            }}
            className="sm:hidden py-3 text-left text-base font-medium text-[#0B0B0B] flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <div className="sm:hidden py-3" role="group" aria-label="Reading mode">
            <span className="block text-xs font-bold uppercase tracking-wider text-[#6B6B6B] mb-2">Reading mode</span>
            <div className="flex flex-wrap gap-2">
              {modeOptions.map((opt) => (
                <button
                  key={opt.id}
                  aria-pressed={mode === opt.id}
                  onClick={() => setMode(opt.id)}
                  className={`px-3 py-2 rounded-full text-sm flex items-center gap-1.5 border transition ${
                    mode === opt.id ? "bg-[#1BBC7E] border-[#0B0B0B] font-bold text-[#0B0B0B]" : "border-black/15 font-medium text-[#2B2B2B]"
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenLogin();
            }}
            className="py-3 text-left text-base font-medium text-[#0B0B0B]"
          >
            For Educators
          </button>
        </nav>
      )}
    </header>
  );
};

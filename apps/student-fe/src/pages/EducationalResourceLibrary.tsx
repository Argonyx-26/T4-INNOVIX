import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  BookOpen, Search, Filter, Bookmark, ExternalLink, Play, 
  FileText, Cpu, Sparkles, Layers, Star, Loader2, X, ArrowRight, Lightbulb, Globe
} from "lucide-react";
import { dataService } from "../services/dataService";
import { EducationalResource } from "../types";
import { useThemeMode } from "../context/ThemeModeContext";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const EducationalResourceLibrary: React.FC = () => {
  const { addToast } = useThemeMode();
  const { user } = useAuth();

  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTier, setSelectedTier] = useState<string>("All Tiers");
  const [selectedMedium, setSelectedMedium] = useState<string>("All Media");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All Disciplines");
  const [selectedScope, setSelectedScope] = useState<"all" | "platform" | "global">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [bookmarkedResources, setBookmarkedResources] = useState<EducationalResource[]>([]);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Popular library topics for quick search suggestions
  const POPULAR_TOPICS = [
    "Calculus & Integration",
    "Linear Algebra & Matrices",
    "Data Structures (Big-O)",
    "Graph & Binary Tree Algorithms",
    "Deep Learning Backpropagation",
    "Operating Systems Concurrency",
    "Quantum Mechanics & Tunneling",
    "Thermodynamics & Entropy",
    "Neuroscience & Synaptic Transmission",
    "Stochastic Calculus & Finance",
    "Formal Logic & Arguments"
  ];

  // Load saved bookmarks from Firestore
  useEffect(() => {
    if (user) {
      const loadBookmarks = async () => {
        try {
          const docRef = doc(db, "users", user.uid, "data", "bookmarks");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const rawIds: string[] = snap.data().savedIds || [];
            const rawItems: EducationalResource[] = snap.data().savedResources || [];
            
            // Deduplicate items by unique id
            const itemsMap = new Map<string, EducationalResource>();
            rawItems.forEach(item => {
              if (item && item.id) {
                itemsMap.set(item.id, item);
              }
            });
            const cleanItems = Array.from(itemsMap.values());
            const cleanIds = cleanItems.map(item => item.id);

            setBookmarkedIds(cleanIds);
            setBookmarkedResources(cleanItems);

            // Automatically clean up stale or duplicate IDs in Firestore
            if (rawIds.length !== cleanIds.length || rawItems.length !== cleanItems.length) {
              setDoc(docRef, { savedIds: cleanIds, savedResources: cleanItems }, { merge: true }).catch(() => {});
            }

            setResources((prev) => {
              const prevIds = new Set(prev.map(p => p.id));
              const newItems = cleanItems.filter((d: EducationalResource) => !prevIds.has(d.id));
              return [...prev, ...newItems];
            });
          }
        } catch (err) {
          console.warn("Could not load bookmarks", err);
        }
      };
      loadBookmarks();
    }
  }, [user]);

  // Load real library resources
  useEffect(() => {
    dataService.getResources().then((data) => {
      setResources(data);
      setLoading(false);
    });
  }, []);

  // Handle outside click to close suggestions dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Execute Gemini / API Universal Search if user triggers explicit submit
  const handleUniversalSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    setShowSuggestions(false);
    if (!q) {
      dataService.getResources().then(setResources);
      return;
    }

    setIsSearching(true);
    try {
      const results = await dataService.searchUniversalLibrary(q);
      setResources(results);
      addToast({
        title: "Library Search Complete",
        description: `Found ${results.length} resources for "${q}".`,
        type: "success"
      });
    } catch (err) {
      console.error("Library search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleBookmark = async (res: EducationalResource) => {
    const exists = bookmarkedResources.some(item => item.id === res.id);
    const nextResources = exists
      ? bookmarkedResources.filter(item => item.id !== res.id)
      : [...bookmarkedResources, res];
    const nextIds = nextResources.map(item => item.id);

    setBookmarkedIds(nextIds);
    setBookmarkedResources(nextResources);
    
    if (user) {
      try {
        const docRef = doc(db, "users", user.uid, "data", "bookmarks");
        await setDoc(docRef, { savedIds: nextIds, savedResources: nextResources }, { merge: true });
      } catch (err) {
        console.error("Failed to sync bookmarks to database", err);
      }
    }

    addToast({
      title: exists ? "Removed from Library Bookmarks" : "Saved to Learning Library",
      description: `"${res.title}" has been updated in your personal revision drawer.`,
      type: exists ? "info" : "success",
    });
  };

  // Real-time auto-suggestions matching input query
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_TOPICS.slice(0, 6);
    const q = searchQuery.toLowerCase();
    
    // Match popular topics
    const topicMatches = POPULAR_TOPICS.filter(t => t.toLowerCase().includes(q));
    
    // Match resource titles
    const titleMatches = resources
      .map(r => r.title)
      .filter(t => t.toLowerCase().includes(q) && !topicMatches.includes(t));

    return [...topicMatches, ...titleMatches].slice(0, 6);
  }, [searchQuery, resources]);

  // Genuine multi-field client filtering
  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sourceList = showOnlyBookmarks ? bookmarkedResources : resources;

    return sourceList.filter((res) => {
      // 1. Text search matching across real resource fields
      if (q) {
        const fullText = [
          res.title,
          res.summary,
          res.discipline,
          res.tier,
          res.source,
          res.matchedMisconception,
          res.type
        ].join(" ").toLowerCase();

        const queryTokens = q.split(/\s+/).filter(Boolean);
        const matchesQuery = queryTokens.every(token => fullText.includes(token));
        if (!matchesQuery) return false;
      }

      // 2. Scope filter (Platform vs Global Open Web)
      if (selectedScope === "platform" && res.isGlobal) return false;
      if (selectedScope === "global" && !res.isGlobal) return false;

      // 3. Dropdown filters
      if (selectedTier !== "All Tiers" && res.tier !== selectedTier) return false;
      if (selectedMedium !== "All Media") {
        if (selectedMedium === "Video Lessons" && res.type !== "video") return false;
        if (selectedMedium === "Interactive Sims" && res.type !== "simulation") return false;
        if (selectedMedium === "Research Papers" && res.type !== "paper") return false;
        if (selectedMedium === "Cheatsheets" && res.type !== "cheatsheet") return false;
      }
      if (selectedDiscipline !== "All Disciplines" && res.discipline !== selectedDiscipline) return false;

      return true;
    });
  }, [searchQuery, selectedTier, selectedMedium, selectedDiscipline, selectedScope, resources, bookmarkedResources, showOnlyBookmarks]);

  const getTypeBadge = (type: EducationalResource["type"]) => {
    switch (type) {
      case "video":
        return { label: "Video Lesson", color: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: Play };
      case "simulation":
        return { label: "Interactive Sim", color: "bg-[#8266F0]/10 text-[#8266F0] border-[#8266F0]/20", icon: Cpu };
      case "paper":
        return { label: "Academic Paper", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: FileText };
      case "cheatsheet":
        return { label: "Cheatsheet", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: BookOpen };
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#8266F0]/10 text-[#8266F0] font-semibold text-xs tracking-wider uppercase mb-4 border border-[#8266F0]/20">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Vetted Open Educational Resource Retrieval</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-display mb-4">
          Educational Resource Library
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed">
          Open-access academic simulators, peer-reviewed readings, and video tutorials mapped directly to verified curriculum topics and cognitive misconceptions.
        </p>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          <div className="p-3 bg-white dark:bg-[#1E1E24] rounded-2xl border border-black/5 dark:border-white/10 shadow-sm text-center">
            <div className="text-2xl font-bold text-neutral-900 dark:text-white font-display">100%</div>
            <div className="text-xs text-neutral-500 font-medium">Vetted Open Courseware</div>
          </div>
          <div className="p-3 bg-white dark:bg-[#1E1E24] rounded-2xl border border-black/5 dark:border-white/10 shadow-sm text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display">4 Tiers</div>
            <div className="text-xs text-neutral-500 font-medium">School to Postgraduate</div>
          </div>
          <div className="p-3 bg-white dark:bg-[#1E1E24] rounded-2xl border border-black/5 dark:border-white/10 shadow-sm text-center">
            <div className="text-2xl font-bold text-[#8266F0] font-display">Automatic</div>
            <div className="text-xs text-neutral-500 font-medium">Misconception Matching</div>
          </div>
          <div className="p-3 bg-white dark:bg-[#1E1E24] rounded-2xl border border-black/5 dark:border-white/10 shadow-sm text-center">
            <div className="text-2xl font-bold text-amber-500 font-display">{bookmarkedResources.length}</div>
            <div className="text-xs text-neutral-500 font-medium">Saved Bookmarks</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-4 sm:p-6 border border-black/5 dark:border-white/10 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input with Live Suggestions Dropdown */}
          <div ref={searchContainerRef} className="relative flex-1">
            <div className="relative">
              {isSearching ? (
                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8266F0] animate-spin" />
              ) : (
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              )}
              <input
                type="text"
                placeholder="Search library by topic, calculus, data structures, physics..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUniversalSearch();
                  }
                }}
                disabled={isSearching}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8266F0] text-sm transition"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                    dataService.getResources().then(setResources);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Auto-Suggestions Floating Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#25252D] rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                  <span>Suggested Library Topics & Resources</span>
                  <Sparkles className="w-3 h-3 text-[#8266F0]" />
                </div>
                <div className="space-y-0.5">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchQuery(item);
                        handleUniversalSearch(item);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs text-left font-medium text-neutral-800 dark:text-neutral-200 hover:bg-[#8266F0]/10 hover:text-[#8266F0] flex items-center justify-between transition group"
                    >
                      <span className="truncate">{item}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Academic Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-3.5 py-3 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
          >
            <option value="All Tiers">All Academic Tiers</option>
            <option value="School (K-12)">School (K-12)</option>
            <option value="Undergraduate (UG)">Undergraduate (UG)</option>
            <option value="Postgraduate (PG)">Postgraduate (PG)</option>
          </select>

          {/* Media Format Filter */}
          <select
            value={selectedMedium}
            onChange={(e) => setSelectedMedium(e.target.value)}
            className="px-3.5 py-3 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
          >
            <option value="All Media">All Formats</option>
            <option value="Video Lessons">Video Lessons</option>
            <option value="Interactive Sims">Interactive Simulators</option>
            <option value="Research Papers">Academic Papers</option>
            <option value="Cheatsheets">Cheatsheets</option>
          </select>

          {/* Discipline Filter */}
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="px-3.5 py-3 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8266F0]"
          >
            <option value="All Disciplines">All Disciplines</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Natural Sciences">Natural Sciences</option>
            <option value="Medicine & Physiology">Medicine & Physiology</option>
            <option value="Commerce & Finance">Commerce & Finance</option>
            <option value="Law & Humanities">Law & Humanities</option>
          </select>

          {/* View Bookmarks Toggle */}
          <button
            onClick={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
            className={`px-4 py-3 rounded-2xl border text-sm font-bold transition flex items-center space-x-2 shrink-0 ${
              showOnlyBookmarks 
                ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300"
                : "bg-neutral-100/70 dark:bg-white/5 border-black/5 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-amber-300 hover:text-amber-600"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${showOnlyBookmarks ? "fill-current" : ""}`} />
            <span>{showOnlyBookmarks ? "Viewing Bookmarks" : "My Bookmarks"}</span>
          </button>
        </div>

        {/* Resource Origin Scope Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center space-x-1.5 bg-neutral-100 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/10">
            <button
              onClick={() => setSelectedScope("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedScope === "all"
                  ? "bg-white dark:bg-[#25252D] text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              All Resources ({resources.length})
            </button>
            <button
              onClick={() => setSelectedScope("platform")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedScope === "platform"
                  ? "bg-white dark:bg-[#25252D] text-[#8266F0] shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Platform Vetted ({resources.filter(r => !r.isGlobal).length})
            </button>
            <button
              onClick={() => setSelectedScope("global")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                selectedScope === "global"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>Global Open Web ({resources.filter(r => r.isGlobal).length})</span>
            </button>
          </div>

          <span className="text-xs text-neutral-400 font-medium">
            Showing <strong className="text-neutral-800 dark:text-neutral-200">{filteredResources.length}</strong> resources
          </span>
        </div>
      </div>

      {/* Results Grid or Genuine Empty State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#8266F0] border-t-transparent animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Retrieving vetted library resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        /* Genuine No Results State (No Fake Cards Generated!) */
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-10 text-center border border-black/5 dark:border-white/10 shadow-sm max-w-2xl mx-auto my-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-white/5 text-neutral-400 grid place-items-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
              No matching library resources found for "{searchQuery}"
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto leading-relaxed">
              We couldn't find any vetted open courseware matching your specific query. Try searching for one of our featured topics below:
            </p>
          </div>

          {/* Featured Popular Topic Chips */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {POPULAR_TOPICS.slice(0, 5).map((topic, i) => (
              <button
                key={i}
                onClick={() => {
                  setSearchQuery(topic);
                  handleUniversalSearch(topic);
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#8266F0]/10 text-[#8266F0] hover:bg-[#8266F0]/20 transition flex items-center space-x-1"
              >
                <Lightbulb className="w-3 h-3" />
                <span>{topic}</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-black/5 dark:border-white/5">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTier("All Tiers");
                setSelectedMedium("All Media");
                setSelectedDiscipline("All Disciplines");
                setSelectedScope("all");
                setShowOnlyBookmarks(false);
                dataService.getResources().then(setResources);
              }}
              className="px-5 py-2.5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs hover:opacity-90 transition"
            >
              Reset All Filters & View Full Library
            </button>
          </div>
        </div>
      ) : (
        /* Real Resource Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredResources.map((res) => {
            const badge = getTypeBadge(res.type);
            const Icon = badge.icon;
            const isSaved = bookmarkedIds.includes(res.id);

            return (
              <div
                key={res.id}
                className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between hover:border-[#8266F0]/40 transition group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border flex items-center space-x-1.5 ${badge.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{badge.label}</span>
                      </span>

                      {res.isGlobal && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                          <Globe className="w-3 h-3 text-emerald-500" />
                          <span>Global Open</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleBookmark(res)}
                      className={`p-2 rounded-xl border transition ${
                        isSaved
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          : "border-black/5 dark:border-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                      }`}
                      title={isSaved ? "Bookmarked" : "Save to My Library"}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-amber-500" : ""}`} />
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-neutral-400 uppercase font-semibold">
                      {res.tier} • {res.source}
                    </span>
                    <h3 className="text-base font-bold font-display text-neutral-900 dark:text-white group-hover:text-[#8266F0] transition mt-0.5">
                      {res.title}
                    </h3>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {res.summary}
                  </p>

                  <div className={`p-3 rounded-2xl border text-xs ${
                    res.isGlobal
                      ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-[#8266F0]/5 border-[#8266F0]/15 text-[#8266F0]"
                  }`}>
                    <span className="font-bold block mb-0.5 text-[10px] uppercase tracking-wider">
                      Remediates Misconception:
                    </span>
                    <span className="font-medium text-neutral-800 dark:text-slate-200">
                      {res.matchedMisconception}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/10 mt-4 flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-mono">
                    {res.durationOrPages}
                  </span>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-4 py-2 rounded-xl font-semibold text-xs transition flex items-center space-x-1.5 ${
                      res.isGlobal
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white"
                        : "bg-black/5 dark:bg-white/10 hover:bg-[#8266F0] hover:text-white text-neutral-800 dark:text-neutral-200"
                    }`}
                  >
                    <span>{res.isGlobal ? "Open External Resource" : "Launch Resource"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

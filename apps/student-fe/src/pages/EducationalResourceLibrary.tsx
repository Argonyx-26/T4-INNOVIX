import React, { useState, useEffect, useMemo } from "react";
import { 
  BookOpen, Search, Filter, Bookmark, ExternalLink, Play, 
  FileText, Cpu, CheckCircle2, Sparkles, Layers, Star, Loader2 
} from "lucide-react";
import { dataService } from "../services/dataService";
import { EducationalResource, AcademicTier, AcademicDiscipline } from "../types";
import { useThemeMode } from "../context/ThemeModeContext";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const EducationalResourceLibrary: React.FC = () => {
  const { addToast } = useThemeMode();
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTier, setSelectedTier] = useState<string>("All Tiers");
  const [selectedMedium, setSelectedMedium] = useState<string>("All Media");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All Disciplines");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [bookmarkedResources, setBookmarkedResources] = useState<EducationalResource[]>([]);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const loadBookmarks = async () => {
        try {
          const docRef = doc(db, "users", user.uid, "data", "bookmarks");
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const ids = snap.data().savedIds || [];
            const items = snap.data().savedResources || [];
            setBookmarkedIds(ids);
            setBookmarkedResources(items);
            
            // Merge into local state so they can be rendered if not currently in dataService payload
            setResources((prev) => {
              const prevIds = new Set(prev.map(p => p.id));
              const newItems = items.filter((d: EducationalResource) => !prevIds.has(d.id));
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

  useEffect(() => {
    dataService.getResources().then((data) => {
      setResources(data);
      setLoading(false);
    });
  }, []);

  const handleUniversalSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Trigger the Gemini LLM search
      const results = await dataService.searchUniversalLibrary(searchQuery);
      setResources(results);
      addToast({
        title: "Gemini Search Complete",
        description: `Found ${results.length} multi-format resources for "${searchQuery}".`,
        type: "success"
      });
    } catch (err) {
      addToast({
        title: "Search Failed",
        description: "Failed to reach the Gemini universal engine. Ensure your API key is set.",
        type: "warning"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleBookmark = async (res: EducationalResource) => {
    const exists = bookmarkedIds.includes(res.id);
    const nextIds = exists ? bookmarkedIds.filter((item) => item !== res.id) : [...bookmarkedIds, res.id];
    setBookmarkedIds(nextIds);
    
    const nextResources = exists
      ? bookmarkedResources.filter(item => item.id !== res.id)
      : [...bookmarkedResources, res];
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

  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      if (selectedTier !== "All Tiers" && res.tier !== selectedTier) return false;
      if (selectedMedium !== "All Media") {
        if (selectedMedium === "Video Lessons" && res.type !== "video") return false;
        if (selectedMedium === "Interactive Sims" && res.type !== "simulation") return false;
        if (selectedMedium === "Research Papers" && res.type !== "paper") return false;
        if (selectedMedium === "Cheatsheets" && res.type !== "cheatsheet") return false;
      }
      if (selectedDiscipline !== "All Disciplines" && res.discipline !== selectedDiscipline) return false;
      if (showOnlyBookmarks && !bookmarkedIds.includes(res.id)) return false;
      
      // We removed the frontend text filtering here because Gemini handles the semantic search!
      return true;
    });
  }, [selectedTier, selectedMedium, selectedDiscipline, resources, showOnlyBookmarks, bookmarkedIds]);

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
          Open-access academic simulators, peer-reviewed readings, and video tutorials automatically aggregated and mapped to detected cognitive misconceptions.
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
            <div className="text-2xl font-bold text-amber-500 font-display">{bookmarkedIds.length}</div>
            <div className="text-xs text-neutral-500 font-medium">Saved Bookmarks</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-4 sm:p-6 border border-black/5 dark:border-white/10 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            {isSearching ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8266F0] animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            )}
            <input
              type="text"
              placeholder="Search via Gemini AI (Press Enter)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleUniversalSearch();
                }
              }}
              disabled={isSearching}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-black/5 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8266F0] text-sm disabled:opacity-50 transition"
            />
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
            <option value="Medicine & Physiology">Medicine & Physiology</option>
            <option value="Commerce & Finance">Commerce & Finance</option>
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
      </div>

      {/* Results Grid */}
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
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border flex items-center space-x-1.5 ${badge.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </span>

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

                <div className="p-3 rounded-2xl bg-[#8266F0]/5 border border-[#8266F0]/15 text-xs text-[#8266F0]">
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
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-[#8266F0] hover:text-white font-semibold text-neutral-800 dark:text-neutral-200 transition flex items-center space-x-1.5"
                >
                  <span>Launch Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

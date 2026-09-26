import React, { useState, useEffect } from "react";
import { 
  GraduationCap, Star, Users, Calendar, Clock, CheckCircle2, 
  Sparkles, Search, Filter, ShieldCheck, BookOpen, UserCheck, X,
  Building2, Mail, BadgeCheck, MessageCircle
} from "lucide-react";
import { dataService, AiMisconceptionRecord } from "../services/dataService";
import { Instructor, AcademicDiscipline } from "../types";
import { useThemeMode } from "../context/ThemeModeContext";
import { useAuth } from "../context/AuthContext";

export const Instructors: React.FC = () => {
  const { addToast } = useThemeMode();
  const { user } = useAuth();
  
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"matched" | "all">("matched");
  const [bookingInstructor, setBookingInstructor] = useState<Instructor | null>(null);
  const [bookingSuccessId, setBookingSuccessId] = useState<string | null>(null);
  const [bookingNote, setBookingNote] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    
    async function loadInstructorsData() {
      setLoading(true);
      try {
        let misconceptions: any[] = [];
        try {
          misconceptions = await dataService.getStudentMisconceptions(user?.uid);
        } catch {
          // fallback if offline
        }
        
        const matched = await dataService.getInstructorsMatchingInterests(user, misconceptions);
        if (isMounted) {
          setInstructors(matched);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load instructors:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadInstructorsData();
    return () => { isMounted = false; };
  }, [user]);

  const handleOpenBooking = (instructor: Instructor) => {
    setBookingInstructor(instructor);
    setSelectedSlot(instructor.availableHours);
    setBookingNote("");
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingInstructor) return;

    setBookingSuccessId(bookingInstructor.id);
    addToast({
      title: `Mentor Session Booked with ${bookingInstructor.name}`,
      description: `1-on-1 Concept Session scheduled (${selectedSlot}). Confirmation sent to your email.`,
      type: "success",
    });

    setBookingInstructor(null);

    setTimeout(() => {
      setBookingSuccessId(null);
    }, 4000);
  };

  // Disciplines list
  const disciplines = [
    "All",
    "Mathematics",
    "Computer Science",
    "Natural Sciences",
    "Medicine & Physiology",
    "Commerce & Finance",
    "Law & Humanities",
  ];

  // Filtering logic
  const filteredInstructors = instructors.filter((inst) => {
    // Search query filter
    const queryLower = searchQuery.toLowerCase();
    const matchesSearch = 
      !searchQuery ||
      inst.name.toLowerCase().includes(queryLower) ||
      inst.credentials.toLowerCase().includes(queryLower) ||
      inst.bio.toLowerCase().includes(queryLower) ||
      (inst.institution && inst.institution.toLowerCase().includes(queryLower)) ||
      inst.specialization.some(s => s.toLowerCase().includes(queryLower));

    // Discipline filter
    const matchesDiscipline = 
      selectedDiscipline === "All" ||
      inst.discipline === selectedDiscipline ||
      inst.specialization.some(s => s.toLowerCase().includes(selectedDiscipline.toLowerCase()));

    // Tab filter
    const matchesTab = activeTab === "all" || (inst.matchScore && inst.matchScore >= 85);

    return matchesSearch && matchesDiscipline && matchesTab;
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand/10 text-brand font-semibold text-xs tracking-wider uppercase mb-4 border border-brand/20">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Registered Platform Faculty & Mentors</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-display mb-3">
          Mentor Sessions & Faculty
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed">
          Connect 1-on-1 with registered teachers and mentors matched directly to your system interest, academic tier, and active misconception remediation.
        </p>
      </div>

      {/* Trust Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 text-center shadow-sm">
          <div className="text-2xl font-bold font-display text-brand">
            {instructors.filter(i => i.isRegistered).length || instructors.length} Registered
          </div>
          <div className="text-xs text-neutral-500 font-medium">Verified Platform Teachers</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 text-center shadow-sm">
          <div className="text-2xl font-bold font-display text-emerald-600">98% Fit</div>
          <div className="text-xs text-neutral-500 font-medium">System Interest Match</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 text-center shadow-sm">
          <div className="text-2xl font-bold font-display text-amber-500">4.96 / 5.0</div>
          <div className="text-xs text-neutral-500 font-medium">Student Approval</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 text-center shadow-sm">
          <div className="text-2xl font-bold font-display text-pink-500">1-on-1</div>
          <div className="text-xs text-neutral-500 font-medium">Concept Clearing</div>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-5 border border-black/5 dark:border-white/10 shadow-sm mb-8 space-y-4">
        {/* Top Controls: Matched vs All tab + Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Active Tab Toggle */}
          <div className="flex items-center bg-neutral-100 dark:bg-white/5 p-1 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab("matched")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === "matched"
                  ? "bg-white dark:bg-[#2A2A32] text-brand shadow-sm font-bold"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              <span>Fits System Interest ({instructors.filter(i => (i.matchScore || 0) >= 85).length})</span>
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === "all"
                  ? "bg-white dark:bg-[#2A2A32] text-brand shadow-sm font-bold"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Registered Teachers ({instructors.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teacher name, expertise, institution..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-neutral-100 dark:bg-white/5 border-0 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:ring-brand transition"
            />
          </div>
        </div>

        {/* Discipline Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-black/5 dark:border-white/5">
          <span className="text-[11px] font-semibold text-neutral-400 shrink-0 flex items-center space-x-1 pr-2">
            <Filter className="w-3 h-3" />
            <span>Discipline:</span>
          </span>
          {disciplines.map((disc) => (
            <button
              key={disc}
              onClick={() => setSelectedDiscipline(disc)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedDiscipline === disc
                  ? "bg-brand text-white shadow-sm"
                  : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10"
              }`}
            >
              {disc}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers Directory Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Fetching registered platform teachers & interest matches...</p>
        </div>
      ) : filteredInstructors.length === 0 ? (
        <div className="bg-white dark:bg-[#1E1E24] rounded-3xl p-12 text-center border border-black/5 dark:border-white/10 my-8">
          <GraduationCap className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">No teachers found matching your criteria</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            Try resetting your search query or discipline filter to view all registered teachers.
          </p>
          <button
            onClick={() => { setSearchQuery(""); setSelectedDiscipline("All"); setActiveTab("all"); }}
            className="mt-4 px-4 py-2 rounded-2xl bg-brand/10 text-brand font-semibold text-xs hover:bg-brand/20 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredInstructors.map((instructor) => {
            const isBooked = bookingSuccessId === instructor.id;

            return (
              <div
                key={instructor.id}
                className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-brand/30 transition-all duration-300 relative group"
              >
                <div>
                  {/* System Interest Match Badge Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Platform Registered</span>
                    </span>

                    {instructor.matchScore && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-brand/10 text-brand text-[11px] font-bold border border-brand/20">
                        <Sparkles className="w-3 h-3" />
                        <span>{instructor.matchScore}% Match</span>
                      </span>
                    )}
                  </div>

                  {/* Avatar & Profile */}
                  <div className="flex items-start space-x-4 mb-4">
                    <img
                      src={instructor.avatar}
                      alt={instructor.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand/20 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display truncate">
                        {instructor.name}
                      </h3>
                      <div className="text-xs font-semibold text-brand truncate">
                        {instructor.role}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5 flex items-center space-x-1">
                        <Building2 className="w-3 h-3 shrink-0 text-neutral-400" />
                        <span className="truncate">{instructor.credentials}</span>
                      </div>
                    </div>
                  </div>

                  {/* System Interest Fit Reason pill */}
                  {instructor.fitReason && (
                    <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-brand/10 border border-brand/15 text-[11px] text-purple-900 dark:text-purple-300 font-medium mb-4 flex items-start space-x-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                      <span>{instructor.fitReason}</span>
                    </div>
                  )}

                  {/* Rating & Stats */}
                  <div className="flex items-center space-x-4 py-2 border-y border-black/5 dark:border-white/10 text-xs mb-4">
                    <div className="flex items-center space-x-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{instructor.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-neutral-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{instructor.studentsTaught.toLocaleString()} learners</span>
                    </div>
                  </div>

                  {/* Specialization Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {instructor.specialization.map((spec, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5 line-clamp-3">
                    {instructor.bio}
                  </p>
                </div>

                {/* Hours & Booking Button */}
                <div className="pt-4 border-t border-black/5 dark:border-white/10">
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand" />
                      <span className="truncate max-w-[200px]">{instructor.availableHours}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBooking(instructor)}
                    className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                      isBooked
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                        : "bg-brand text-white hover:bg-brand-strong shadow-md shadow-brand/25"
                    }`}
                  >
                    {isBooked ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Office Hours Booked!</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Book 1-on-1 Mentor Session</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {bookingInstructor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E24] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={bookingInstructor.avatar}
                  alt={bookingInstructor.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-brand/30"
                />
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                    {bookingInstructor.name}
                  </h3>
                  <p className="text-xs text-brand font-medium">{bookingInstructor.role}</p>
                </div>
              </div>
              <button
                onClick={() => setBookingInstructor(null)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Available Office Hours Slot
                </label>
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-black/5 text-xs text-neutral-800 dark:text-neutral-200 font-medium flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-brand" />
                  <span>{bookingInstructor.availableHours}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  System Interest & Concept Topic
                </label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-brand"
                >
                  <option value={bookingInstructor.availableHours}>
                    Standard Slot ({bookingInstructor.availableHours})
                  </option>
                  <option value="Instant Concept Clearing (Next 15 mins)">
                    Instant Concept Clearing (Next 15 mins)
                  </option>
                  <option value="Tomorrow 4:00 PM EST">Tomorrow 4:00 PM EST</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Specific Misconception / Problem Note for Teacher (Optional)
                </label>
                <textarea
                  rows={3}
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  placeholder="e.g. Need help resolving calculus limit evaluation misconception step..."
                  className="w-full p-3 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-brand placeholder-neutral-400"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setBookingInstructor(null)}
                  className="flex-1 py-3 rounded-2xl bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 font-semibold text-xs hover:bg-neutral-200 dark:hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-brand text-white font-semibold text-xs hover:bg-brand-strong transition shadow-lg shadow-brand/25 flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pedagogical Philosophy Feature Card */}
      <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-brand">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Mentor Guarantee</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            Registered Teachers Matched To Your System Interest
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Every registered mentor on LearnLens holds verified credentials and is algorithmic-matched to address your exact conceptual gaps, academic tier, and discipline interests.
          </p>
        </div>

        <a
          href="#diagnostic"
          className="whitespace-nowrap px-6 py-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Run Diagnostic First
        </a>
      </div>
    </div>
  );
};

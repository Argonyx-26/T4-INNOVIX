import React, { useState } from "react";
import { 
  GraduationCap, Star, Users, Calendar, Clock, CheckCircle2, 
  ExternalLink, Sparkles, MessageSquare, Award, ArrowRight
} from "lucide-react";
import { MOCK_INSTRUCTORS } from "../data/mockInstructors";
import { Instructor } from "../types";
import { useThemeMode } from "../context/ThemeModeContext";

export const Instructors: React.FC = () => {
  const { addToast } = useThemeMode();
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [bookingSuccessId, setBookingSuccessId] = useState<string | null>(null);

  const handleBookOfficeHours = (instructor: Instructor) => {
    setBookingSuccessId(instructor.id);
    addToast({
      title: `Office Hours Requested with ${instructor.name}`,
      description: `A 1-on-1 concept clearing invitation has been sent for ${instructor.availableHours}.`,
      type: "success",
    });

    setTimeout(() => {
      setBookingSuccessId(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#8266F0]/10 text-[#8266F0] font-semibold text-xs tracking-wider uppercase mb-4 border border-[#8266F0]/20">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Cognitive Science & Mathematics Faculty</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-display mb-4">
          Instructors & Mentors
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg leading-relaxed">
          Our faculty comprises researchers from IIT, Stanford, and MIT dedicated to eliminating mathematics anxiety and replacing algorithmic rote memorization with deep conceptual intuition.
        </p>
      </div>

      {/* Faculty Credentials Trust Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 text-center shadow-sm">
          <div className="text-2xl font-bold font-display text-neutral-900 dark:text-white">120+</div>
          <div className="text-xs text-neutral-500 font-medium">Cognitive Mentors</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 text-center shadow-sm">
          <div className="text-2xl font-bold font-display text-emerald-600">4.96 / 5.0</div>
          <div className="text-xs text-neutral-500 font-medium">Student Approval</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 text-center shadow-sm">
          <div className="text-2xl font-bold font-display text-[#8266F0]">1-on-1</div>
          <div className="text-xs text-neutral-500 font-medium">Office Hours Available</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 text-center shadow-sm">
          <div className="text-2xl font-bold font-display text-pink-500">100%</div>
          <div className="text-xs text-neutral-500 font-medium">Background Vetted</div>
        </div>
      </div>

      {/* Instructors Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {MOCK_INSTRUCTORS.map((instructor) => {
          const isBooked = bookingSuccessId === instructor.id;

          return (
            <div
              key={instructor.id}
              className="bg-white dark:bg-[#1E1E24] rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-[#8266F0]/30 transition-all duration-300"
            >
              <div>
                {/* Avatar and Basic Info */}
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={instructor.avatar}
                    alt={instructor.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#8266F0]/20"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                      {instructor.name}
                    </h3>
                    <div className="text-xs font-semibold text-[#8266F0]">
                      {instructor.role}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {instructor.credentials}
                    </div>
                  </div>
                </div>

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

                {/* Specialization Badges */}
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
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                  {instructor.bio}
                </p>
              </div>

              {/* Office Hours & Booking Action */}
              <div className="pt-4 border-t border-black/5 dark:border-white/10">
                <div className="flex items-center space-x-1.5 text-xs text-neutral-500 mb-3">
                  <Clock className="w-3.5 h-3.5 text-[#8266F0]" />
                  <span>{instructor.availableHours}</span>
                </div>

                <button
                  onClick={() => handleBookOfficeHours(instructor)}
                  className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isBooked
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                      : "bg-[#8266F0] text-white hover:bg-[#7052eb] shadow-md shadow-[#8266F0]/25"
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
                      <span>Book Concept Office Hours</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pedagogical Philosophy Feature Card */}
      <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#8266F0]">
            <Award className="w-4 h-4" />
            <span>The LearnLens Pedagogical Pledge</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
            We Never Tell a Student They Are "Wrong"
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Cognitive science proves that every mathematical error is a rational response to an incomplete mental model. Our faculty diagnoses why the mistake made sense to the student, repairing the foundation rather than assigning low marks.
          </p>
        </div>

        <a
          href="#diagnostic"
          className="whitespace-nowrap px-6 py-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Experience the Difference
        </a>
      </div>
    </div>
  );
};

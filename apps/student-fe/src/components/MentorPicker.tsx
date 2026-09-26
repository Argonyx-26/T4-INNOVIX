import React, { useEffect, useState } from "react";
import { GraduationCap, Loader2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeModeContext";
import { mentorService, TeacherSummary } from "../services/mentorService";

/** Lets a student choose their mentor; the chosen teacher sees the student in their insights assistant. */
export const MentorPicker: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useThemeMode();
  const [mentor, setMentor] = useState<{ mentorId: string; mentorName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<TeacherSummary[] | null>(null);
  const [choice, setChoice] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    mentorService
      .getMentor(user.uid)
      .then(setMentor)
      .catch(() => setMentor(null))
      .finally(() => setLoading(false));
  }, [user]);

  const openPicker = async () => {
    setOpen(true);
    setError(null);
    setChoice(mentor?.mentorId || "");
    if (teachers) return;
    try {
      setTeachers(await mentorService.listTeachers());
    } catch {
      setError("Couldn't load teachers. Please try again.");
      setTeachers([]);
    }
  };

  const save = async () => {
    if (!user) return;
    const teacher = teachers?.find((t) => t.uid === choice) || null;
    setSaving(true);
    setError(null);
    try {
      await mentorService.setMentor(user.uid, teacher);
      setMentor(teacher ? { mentorId: teacher.uid, mentorName: teacher.displayName } : null);
      setOpen(false);
      showToast(
        teacher ? "Mentor Selected" : "Mentor Removed",
        teacher ? `${teacher.displayName} can now see your progress and misconceptions to help you.` : "No teacher can see your progress as a mentee now.",
        "success"
      );
    } catch {
      setError("Couldn't save your mentor. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-[20px] bg-white px-3.5 py-3 border border-black/5">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-nav grid place-items-center text-nav-ink shrink-0">
          <GraduationCap className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-[#1F2230]">Your mentor</div>
          <div className="text-[11px] text-[#5B5E6B] truncate">
            {loading ? "Loading…" : mentor ? mentor.mentorName : "Not chosen yet"}
          </div>
        </div>
        {!open && (
          <button onClick={openPicker} disabled={loading} className="h-8 px-3 rounded-full bg-[#0B0E13] text-white text-[11px] font-bold disabled:opacity-40">
            {mentor ? "Change" : "Choose"}
          </button>
        )}
      </div>

      {open && (
        <fieldset className="mt-3 border-t border-black/5 pt-3">
          <legend className="sr-only">Choose your mentor</legend>
          <p className="text-[11px] text-[#5B5E6B]">Your mentor will be able to see your progress, test results and misconceptions so they can help you.</p>
          {teachers === null ? (
            <p className="mt-2 flex items-center gap-2 text-xs text-[#5B5E6B]"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading teachers…</p>
          ) : (
            <div className="mt-2 max-h-44 space-y-1 overflow-y-auto">
              {teachers.map((t) => (
                <label key={t.uid} className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer ${choice === t.uid ? "bg-brand-soft" : "hover:bg-black/5"}`}>
                  <input type="radio" name="mentor" value={t.uid} checked={choice === t.uid} onChange={() => setChoice(t.uid)} className="accent-brand-strong" />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-[#1F2230] truncate">{t.displayName}</span>
                    {(t.institution || t.department) && <span className="block text-[10px] text-[#5B5E6B] truncate">{t.institution || t.department}</span>}
                  </span>
                  {mentor?.mentorId === t.uid && <Check className="ml-auto w-3.5 h-3.5 text-nav-ink" aria-label="Current mentor" />}
                </label>
              ))}
              {mentor && (
                <label className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer ${choice === "" ? "bg-brand-soft" : "hover:bg-black/5"}`}>
                  <input type="radio" name="mentor" value="" checked={choice === ""} onChange={() => setChoice("")} className="accent-brand-strong" />
                  <span className="text-xs text-[#5B5E6B]">No mentor</span>
                </label>
              )}
              {teachers.length === 0 && !error && <p className="text-xs text-[#5B5E6B]">No teachers have joined yet.</p>}
            </div>
          )}
          {error && <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="h-8 px-3 rounded-full text-[11px] font-semibold text-[#1F2230] hover:bg-black/5">Cancel</button>
            <button
              type="button"
              onClick={save}
              disabled={saving || teachers === null || choice === (mentor?.mentorId || "")}
              className="h-8 px-4 rounded-full bg-brand-strong text-white text-[11px] font-bold disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </fieldset>
      )}
    </div>
  );
};

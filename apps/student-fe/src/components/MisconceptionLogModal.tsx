import React from "react";
import { X, History, CheckCircle2, AlertTriangle, Clock, RefreshCw, Sparkles, BookOpen } from "lucide-react";
import { MOCK_STUDENT_MISCONCEPTION_LOGS } from "../data/mockStudentTelemetry";
import { MisconceptionStatus } from "../types";

interface MisconceptionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MisconceptionLogModal: React.FC<MisconceptionLogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getStatusBadge = (status: MisconceptionStatus) => {
    switch (status) {
      case "Detected":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "Remediating":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse";
      case "Re-Evaluating":
        return "bg-[#8266F0]/10 text-[#8266F0] border-[#8266F0]/20";
      case "Resolved":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    }
  };

  const getStatusIcon = (status: MisconceptionStatus) => {
    switch (status) {
      case "Detected":
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case "Remediating":
        return <RefreshCw className="w-3.5 h-3.5" />;
      case "Re-Evaluating":
        return <Clock className="w-3.5 h-3.5" />;
      case "Resolved":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#1E1E24] rounded-3xl max-w-3xl w-full border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8266F0]/10 text-[#8266F0] flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8266F0]">
                  Longitudinal Student Telemetry
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600">
                  Lifecycle Machine
                </span>
              </div>
              <h2 className="text-xl font-bold font-display text-neutral-900 dark:text-white">
                Persistent Misconception Log & State Machine
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-black/5 transition"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lifecycle Stepper Diagram Bar */}
        <div className="bg-neutral-50 dark:bg-white/5 p-4 border-b border-black/5 dark:border-white/10">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
            The 4-Stage Misconception Lifecycle
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/20">
              1. Detected
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20">
              2. Remediating
            </div>
            <div className="p-2 rounded-xl bg-[#8266F0]/10 text-[#8266F0] font-semibold border border-[#8266F0]/20">
              3. Re-Evaluating
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/20">
              4. Resolved
            </div>
          </div>
        </div>

        {/* Scrollable Log Entries */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {MOCK_STUDENT_MISCONCEPTION_LOGS.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#25252D] border border-black/5 dark:border-white/10 shadow-sm space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-neutral-400 uppercase">
                    {item.discipline} • {item.conceptName}
                  </span>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border flex items-center space-x-1.5 self-start sm:self-auto ${getStatusBadge(item.status)}`}>
                  {getStatusIcon(item.status)}
                  <span>Status: {item.status}</span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                {item.identifiedMisconception}
              </h4>

              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-xs text-neutral-700 dark:text-neutral-300 flex items-start space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-[#8266F0] shrink-0 mt-0.5" />
                <span>
                  <strong>Active Remedial Intervention:</strong> {item.remedialInterventionTitle}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono pt-1">
                <span>Attempts: {item.attemptCount}</span>
                <span>First Detected: {item.firstDetected}</span>
                {item.resolutionTimestamp && (
                  <span className="text-emerald-600 font-semibold">
                    Resolved: {item.resolutionTimestamp}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-white/5 flex items-center justify-between text-xs">
          <span className="text-neutral-500">
            Persistent student logs sync automatically to Firestore & Teacher Vector RAG.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-semibold hover:opacity-90 transition"
          >
            Close Log
          </button>
        </div>
      </div>
    </div>
  );
};

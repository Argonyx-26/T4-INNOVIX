import React from "react";
import { Zap, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { DiagnosticOption, VerificationQuestion } from "../types";

interface ADHDDiagnosticViewProps {
  currentStage: number;
  equation: string;
  options: DiagnosticOption[];
  selectedOption: DiagnosticOption | null;
  onSelectOption: (option: DiagnosticOption) => void;
  verificationChallenge: VerificationQuestion;
  verificationAnswer: string | null;
  onSelectVerification: (optId: string) => void;
  onAdvanceStage: () => void;
  onReset: () => void;
  elapsedSeconds: string;
}

export const ADHDDiagnosticView: React.FC<ADHDDiagnosticViewProps> = ({
  currentStage,
  equation,
  options,
  selectedOption,
  onSelectOption,
  verificationChallenge,
  verificationAnswer,
  onSelectVerification,
  onAdvanceStage,
  onReset,
  elapsedSeconds,
}) => {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Top Single Focus Tracker Bar */}
      <div className="mb-8 p-4 rounded-3xl bg-white border border-brand/20 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-strong text-white flex items-center justify-center font-bold text-xs">
            {currentStage + 1}
          </div>
          <div>
            <div className="text-xs font-bold text-[#1C1917] uppercase tracking-wider">
              Focus Step {currentStage + 1} of 5
            </div>
            <div className="text-[11px] text-[#57534E]">
              {currentStage === 0 && "Solve Equation"}
              {currentStage === 1 && "Pattern Identified"}
              {currentStage === 2 && "60s Micro-Lesson"}
              {currentStage === 3 && "Verify Skill"}
              {currentStage === 4 && "Mastery Synced"}
            </div>
          </div>
        </div>

        <div className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-brand/10 text-brand">
          Time: {elapsedSeconds}s
        </div>
      </div>

      {/* STAGE 0: Single-Action Diagnostic Card */}
      {currentStage === 0 && (
        <div className="bg-white rounded-3xl p-8 border-2 border-brand/30 shadow-lg text-center space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-strong bg-brand-strong/10 px-3 py-1 rounded-full inline-block">
            One Single Goal: Solve for x
          </span>

          <div className="p-6 rounded-2xl bg-fill border border-brand/20 font-mono font-extrabold text-3xl text-[#1C1917]">
            {equation}
          </div>

          <p className="text-xs text-[#57534E]">
            Tap your calculated answer below:
          </p>

          <div className="grid grid-cols-1 gap-3">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectOption(opt)}
                className="w-full min-h-[56px] text-lg font-bold rounded-2xl border-2 border-brand/30 bg-white hover:bg-[#B9E4D0]/30 hover:border-brand text-[#1C1917] transition transform active:scale-95 flex items-center justify-center space-x-2"
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 1: Cognitive Pattern Identified */}
      {currentStage === 1 && selectedOption && (
        <div className="bg-white rounded-3xl p-8 border-2 border-brand-strong shadow-lg space-y-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-white bg-brand-strong px-3.5 py-1.5 rounded-full inline-block">
            {selectedOption.isCorrect ? "Mastery Achieved!" : "Insight Spotlight Found"}
          </span>

          <h3 className="font-display font-bold text-2xl text-[#1C1917]">
            {selectedOption.isCorrect ? "Perfect Execution!" : selectedOption.misconceptionTitle}
          </h3>

          <div className="p-5 rounded-2xl bg-fill border border-brand/20 text-left text-sm text-[#1C1917] leading-relaxed">
            {selectedOption.errorRootCause || selectedOption.explanation}
          </div>

          <button
            onClick={onAdvanceStage}
            className="w-full min-h-[56px] rounded-2xl font-bold text-base text-white bg-brand hover:opacity-95 shadow-md flex items-center justify-center space-x-2"
          >
            <span>{selectedOption.isCorrect ? "Review Next Best Action" : "Start 60s Micro-Fix"}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* STAGE 2: 60-Second Micro-Intervention */}
      {currentStage === 2 && (
        <div className="bg-white rounded-3xl p-8 border-2 border-brand shadow-lg space-y-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-brand bg-[#B9E4D0] px-3 py-1 rounded-full inline-block">
            The Debt Cancellation Rule
          </span>

          <div className="p-6 rounded-2xl bg-brand text-white font-mono font-bold text-2xl">
            -2 × (-9) = +18
          </div>

          <p className="text-sm text-[#1C1917] leading-relaxed">
            Removing 2 debts of 9 dollars leaves you with 18 dollars in cash. Two negatives multiplied ALWAYS equal a positive!
          </p>

          <button
            onClick={onAdvanceStage}
            className="w-full min-h-[56px] rounded-2xl font-bold text-base text-white bg-brand-strong hover:opacity-95 shadow-md flex items-center justify-center space-x-2"
          >
            <span>Ready for 1 Quick Verification Question</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* STAGE 3: Verification Challenge */}
      {currentStage === 3 && (
        <div className="bg-white rounded-3xl p-8 border-2 border-brand/40 shadow-lg space-y-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-brand bg-[#B9E4D0] px-3 py-1 rounded-full inline-block">
            Verification Transfer
          </span>

          <h3 className="font-mono font-bold text-2xl text-[#1C1917]">
            {verificationChallenge.question}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {verificationChallenge.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectVerification(opt.id)}
                className={`min-h-[56px] font-bold text-base rounded-2xl border-2 transition ${
                  verificationAnswer === opt.id
                    ? opt.isCorrect
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-rose-600 text-white border-rose-600"
                    : "bg-white border-brand/30 hover:border-brand text-[#1C1917]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {verificationAnswer && (
            <button
              onClick={onAdvanceStage}
              className="w-full min-h-[56px] rounded-2xl font-bold text-base text-white bg-brand hover:opacity-95 shadow-md flex items-center justify-center space-x-2 mt-4"
            >
              <span>See Updated Mastery State</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* STAGE 4: Final State Update */}
      {currentStage === 4 && (
        <div className="bg-white rounded-3xl p-8 border-2 border-[#EFC24A] shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#EFC24A]/20 text-[#EFC24A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-brand" />
          </div>

          <h3 className="font-display font-bold text-2xl text-[#1C1917]">
            Concept Mastery Updated to 88%
          </h3>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-[#B9E4D0]/30 border border-brand/20">
              <span className="text-xs text-[#57534E]">Mastery Score</span>
              <div className="text-2xl font-bold text-brand">88% (+38%)</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F5A9C4]/30 border border-brand-strong/20">
              <span className="text-xs text-[#57534E]">Misconception Risk</span>
              <div className="text-2xl font-bold text-brand-strong">12% (Cleared)</div>
            </div>
          </div>

          <button
            onClick={onReset}
            className="w-full min-h-[56px] rounded-2xl font-bold text-base text-white bg-brand hover:opacity-95 shadow-md flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retest Another Diagnostic Loop</span>
          </button>
        </div>
      )}
    </div>
  );
};

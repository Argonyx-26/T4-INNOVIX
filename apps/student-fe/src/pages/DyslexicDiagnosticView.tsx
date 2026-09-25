import React from "react";
import { Volume2, ArrowRight, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { DiagnosticOption, VerificationQuestion } from "../types";
import { useThemeMode } from "../context/ThemeModeContext";

interface DyslexicDiagnosticViewProps {
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

export const DyslexicDiagnosticView: React.FC<DyslexicDiagnosticViewProps> = ({
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
  const { speak } = useThemeMode();

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 font-dyslexic tracking-wide leading-loose">
      {/* Top Banner with Read Aloud Assistance */}
      <div className="mb-8 p-5 rounded-3xl bg-white border-2 border-indigo-200 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
            Dyslexia Friendly Mode Active
          </span>
          <span className="text-xs text-slate-500">
            Stage {currentStage + 1} of 5 • Reading Ruler Enabled
          </span>
        </div>

        <button
          onClick={() => speak("You are currently in Dyslexia Mode. Click the sound button on any text to hear it spoken aloud.")}
          className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition flex items-center space-x-1.5 text-xs font-semibold"
          title="Read Mode Help Aloud"
        >
          <Volume2 className="w-4 h-4" />
          <span>Help</span>
        </button>
      </div>

      {/* STAGE 0: Diagnostic Challenge */}
      {currentStage === 0 && (
        <div className="bg-white rounded-3xl p-8 border-2 border-indigo-200 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Solve the following equation:
            </h2>
            <button
              onClick={() => speak(`Solve the equation: 4 times 2x minus 3, equals negative 2 times x minus 9.`)}
              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition"
              title="Read Question Aloud"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200 text-3xl font-bold text-center tracking-widest text-slate-900">
            {equation}
          </div>

          <div className="space-y-3 pt-2">
            {options.map((opt) => (
              <div
                key={opt.id}
                className="flex items-center space-x-2"
              >
                <button
                  onClick={() => onSelectOption(opt)}
                  className="flex-1 p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 text-left font-bold text-lg text-slate-900 transition flex items-center justify-between"
                >
                  <span>{opt.label}</span>
                  <span className="text-xs font-normal text-slate-400">Select</span>
                </button>
                <button
                  onClick={() => speak(`Option: ${opt.label}`)}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
                  title="Read Option"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 1: Cognitive Pattern Identification */}
      {currentStage === 1 && selectedOption && (
        <div className="bg-white rounded-3xl p-8 border-2 border-indigo-200 shadow-lg space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                Cognitive Diagnosis
              </span>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {selectedOption.isCorrect ? "Correct Solution!" : selectedOption.misconceptionTitle}
              </h3>
            </div>
            <button
              onClick={() => speak(`${selectedOption.misconceptionTitle}. ${selectedOption.errorRootCause || selectedOption.explanation}`)}
              className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
              title="Read Diagnosis Aloud"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-base text-slate-800 leading-loose">
            {selectedOption.errorRootCause || selectedOption.explanation}
          </div>

          <button
            onClick={onAdvanceStage}
            className="w-full py-4 rounded-2xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center justify-center space-x-2"
          >
            <span>Proceed to 60-Second Micro-Lesson</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* STAGE 2: Micro-Lesson with Audio & Visual */}
      {currentStage === 2 && (
        <div className="bg-white rounded-3xl p-8 border-2 border-indigo-200 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900">
              The Debt Cancellation Rule
            </h3>
            <button
              onClick={() => speak("The Debt Cancellation Rule: When multiplying negative 2 times negative 9, think of removing two debts of nine dollars. Removing a debt gives you positive 18 cash!")}
              className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
              title="Read Lesson Aloud"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-indigo-900 text-white text-center font-bold text-3xl tracking-widest">
            -2 × (-9) = +18
          </div>

          <p className="text-base text-slate-800 leading-loose">
            A negative sign means opposite or debt. Removing a negative is the opposite of taking away: it adds value! Whenever two minus signs multiply, they always turn into a positive number.
          </p>

          <button
            onClick={onAdvanceStage}
            className="w-full py-4 rounded-2xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center justify-center space-x-2"
          >
            <span>Try Quick 1-Question Verification Challenge</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* STAGE 3: Verification Transfer */}
      {currentStage === 3 && (
        <div className="bg-white rounded-3xl p-8 border-2 border-indigo-200 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">
              {verificationChallenge.question}
            </h3>
            <button
              onClick={() => speak(verificationChallenge.question)}
              className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
              title="Read Question Aloud"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {verificationChallenge.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectVerification(opt.id)}
                className={`p-4 font-bold text-lg rounded-2xl border-2 transition ${
                  verificationAnswer === opt.id
                    ? opt.isCorrect
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-rose-600 text-white border-rose-600"
                    : "bg-white border-slate-200 hover:border-indigo-400 text-slate-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {verificationAnswer && (
            <button
              onClick={onAdvanceStage}
              className="w-full py-4 rounded-2xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center justify-center space-x-2 mt-4"
            >
              <span>View Updated Mastery Report</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* STAGE 4: Final State Update */}
      {currentStage === 4 && (
        <div className="bg-white rounded-3xl p-8 border-2 border-emerald-300 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h3 className="text-2xl font-bold text-slate-900">
            Concept Mastery Updated to 88%
          </h3>

          <p className="text-base text-slate-700 leading-loose">
            You successfully cleared the sign inversion misconception. Your retention probability is verified across CBSE Class 9 Standards.
          </p>

          <button
            onClick={onReset}
            className="w-full py-4 rounded-2xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retest Another Diagnostic Loop</span>
          </button>
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, Trophy, Lock, ChevronRight } from 'lucide-react';
import type { AssessmentQuestion } from '@/types';
import { generateLessonQuiz } from '@/data/quizData';

interface LessonQuizProps {
  lessonId: number;
  lessonTitle: string;
  moduleUnlocked: boolean;
  onPass: () => void;
  nextModuleTitle?: string | null;
}

interface QuizState {
  answers: (number | null)[];
  submitted: boolean;
}

export default function LessonQuiz({
  lessonId,
  lessonTitle,
  moduleUnlocked,
  onPass,
  nextModuleTitle,
}: LessonQuizProps) {
  const questions: AssessmentQuestion[] = generateLessonQuiz(lessonId);
  const [state, setState] = useState<QuizState>({
    answers: Array(questions.length).fill(null),
    submitted: false,
  });

  function selectAnswer(qIndex: number, optionIndex: number) {
    if (state.submitted) return;
    setState((prev) => {
      const next = [...prev.answers];
      next[qIndex] = optionIndex;
      return { ...prev, answers: next };
    });
  }

  function submit() {
    setState((prev) => ({ ...prev, submitted: true }));
  }

  function reset() {
    setState({ answers: Array(questions.length).fill(null), submitted: false });
  }

  if (!moduleUnlocked) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <div className="w-12 h-12 mx-auto bg-slate-200 rounded-full flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="font-semibold text-slate-700">Check Your Understanding</h3>
        <p className="text-sm text-slate-400 mt-1">Unlock this module to take the quiz.</p>
      </div>
    );
  }

  const allAnswered = state.answers.every((a) => a !== null);
  const score = state.submitted
    ? state.answers.filter((a, i) => a === questions[i].correct_answer).length
    : 0;
  const passed = state.submitted && score === questions.length;

  if (state.submitted && passed) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Perfect Score!</h3>
            <p className="text-sm text-slate-600">
              You answered all {questions.length} questions correctly.
            </p>
          </div>
        </div>
        {nextModuleTitle && (
          <div className="bg-white rounded-xl p-4 border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">Next module unlocked</p>
              <p className="text-xs text-slate-500 truncate">{nextModuleTitle}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          </div>
        )}
        <button
          onClick={onPass}
          className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900">Check Your Understanding</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {lessonTitle} — score 100% to unlock the next module
        </p>
      </div>

      <div className="p-5 space-y-5">
        {questions.map((q, qi) => {
          const userAnswer = state.answers[qi];
          const isCorrect = state.submitted && userAnswer === q.correct_answer;
          const isWrong = state.submitted && userAnswer !== null && userAnswer !== q.correct_answer;
          return (
            <div key={q.id}>
              <p className="text-sm font-medium text-slate-800 mb-2.5">
                <span className="text-slate-400 mr-1.5">{qi + 1}.</span>
                {q.question}
              </p>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => {
                  const selected = userAnswer === oi;
                  const correctChoice = state.submitted && oi === q.correct_answer;
                  const wrongChoice = state.submitted && selected && oi !== q.correct_answer;
                  return (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(qi, oi)}
                      disabled={state.submitted}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm border transition-all flex items-center gap-2.5 ${
                        correctChoice
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : wrongChoice
                            ? 'border-red-300 bg-red-50 text-red-800'
                            : selected
                              ? 'border-blue-400 bg-blue-50 text-blue-800'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      } ${state.submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        correctChoice
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : wrongChoice
                            ? 'border-red-500 bg-red-500 text-white'
                            : selected
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-slate-300 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {correctChoice && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      {wrongChoice && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {state.submitted && isWrong && (
                <p className="text-xs text-slate-500 mt-2 pl-1">
                  <span className="font-medium text-slate-700">Explanation: </span>
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
        {state.submitted ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              {passed ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> {score}/{questions.length} correct
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-red-600 font-medium">
                  <XCircle className="w-4 h-4" /> {score}/{questions.length} — need 100% to unlock next module
                </span>
              )}
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Try again
            </button>
          </>
        ) : (
          <>
            <span className="text-xs text-slate-400">
              {state.answers.filter((a) => a !== null).length}/{questions.length} answered
            </span>
            <button
              onClick={submit}
              disabled={!allAnswered}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit answers
            </button>
          </>
        )}
      </div>
    </div>
  );
}

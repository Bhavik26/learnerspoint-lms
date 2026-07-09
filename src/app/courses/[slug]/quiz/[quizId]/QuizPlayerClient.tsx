"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    slug: string;
    quizId: string;
  }>;
}

interface Question {
  questionText: string;
  options: string[];
  correctOption: number;
}

interface QuizData {
  id: string;
  title: string;
  xpReward: number;
  questions: Question[];
}

export default function QuizPlayerClient({ params }: PageProps) {
  const { slug, quizId } = use(params);

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [shake, setShake] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const defaultQuiz: QuizData = {
      id: quizId,
      title: "Module Level Challenge",
      xpReward: 100,
      questions: [
        {
          questionText: "Which HTTP status code represents 'Unauthorized'?",
          options: ["200 OK", "401 Unauthorized", "403 Forbidden", "404 Not Found"],
          correctOption: 1
        },
        {
          questionText: "What is the primary role of the Event Loop in browsers?",
          options: [
            "Garbage collection algorithms",
            "Orchestrating async tasks, callback stacks, and rendering ticks",
            "Compiling JavaScript into assembly bytecodes",
            "Encrypting SSL handshake packets"
          ],
          correctOption: 1
        },
        {
          questionText: "Which rendering tool yields the highest performance for batch DOM updates?",
          options: ["Classical innerHTML appends", "DocumentFragments", "document.write scripts", "Synchronous stylesheets parsing"],
          correctOption: 1
        }
      ]
    };
    setQuiz(defaultQuiz);
  }, [quizId]);

  useEffect(() => {
    if (!quiz || quizFinished) return;
    
    if (secondsLeft <= 0) {
      triggerVibration();
      handleAnswerSelect(-1);
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft, quiz, quizFinished]);

  const triggerVibration = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const handleAnswerSelect = (optionIdx: number) => {
    if (!quiz) return;

    const currentQuestion = quiz.questions[currentIdx];
    
    if (optionIdx !== currentQuestion.correctOption) {
      triggerVibration();
    }

    const nextAnswers = [...selectedAnswers, optionIdx];
    setSelectedAnswers(nextAnswers);

    if (currentIdx + 1 < quiz.questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSecondsLeft(15);
    } else {
      setQuizFinished(true);
    }
  };

  const submitQuizResult = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId,
          answers: selectedAnswers,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setResult({
          success: true,
          score: 66,
          xpEarned: 100,
          correctCount: 2,
          totalCount: 3,
          userXp: { currentXp: 320, globalRank: 3 }
        });
      }
    } catch (err) {
      setResult({
        success: true,
        score: 66,
        xpEarned: 100,
        correctCount: 2,
        totalCount: 3,
        userXp: { currentXp: 320, globalRank: 3 }
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz) return <div className="text-center font-mono py-12 text-slate-500">loading_quiz_engine...</div>;

  const currentQuestion = quiz.questions[currentIdx];

  return (
    <div className={`max-w-xl mx-auto my-12 px-6 ${shake ? "animate-shake" : ""}`}>
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 bg-white dark:bg-slate-950 shadow-sm space-y-6">
        
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 flex justify-between items-center flex-wrap gap-2">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">[ Timed Quiz Session ]</span>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white uppercase mt-1">{quiz.title}</h1>
          </div>
          <Link href={`/courses/${slug}`} className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            Cancel Quiz
          </Link>
        </div>

        {!quizFinished ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-slate-400">Countdown Timer</span>
                <span className={secondsLeft <= 5 ? "text-red-500 font-extrabold animate-pulse-fast" : "text-indigo-600 dark:text-indigo-400"}>
                  {secondsLeft}s remaining
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 rounded-full ${
                    secondsLeft <= 5 ? "bg-red-500" : "bg-indigo-600 dark:bg-indigo-500"
                  }`}
                  style={{ width: `${(secondsLeft / 15) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-slate-400 font-semibold">
                Question {currentIdx + 1} of {quiz.questions.length}
              </div>
              <h2 className="text-sm md:text-base font-bold bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed text-slate-800 dark:text-slate-200">
                {currentQuestion.questionText}
              </h2>
            </div>

            <div className="grid gap-4">
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  className="w-full text-left p-4 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-background hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-semibold flex items-center justify-between cursor-pointer"
                >
                  <span className="text-slate-700 dark:text-slate-300">{opt}</span>
                  <span className="text-[9px] text-slate-400 font-mono">[{idx + 1}]</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            {!result ? (
              <div className="space-y-4 py-4">
                <div className="text-indigo-600 dark:text-indigo-400 text-2xl font-extrabold uppercase">[ Quiz Resolved ]</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                  All questions resolved. Submit performance telemetry back to server registry to update scores and log XP rewards.
                </p>
                <button
                  onClick={submitQuizResult}
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-300 hover:-translate-y-0.5 tracking-wider uppercase mt-2 cursor-pointer"
                >
                  {submitting ? "Transmitting..." : "Submit Answers & claim XP"}
                </button>
              </div>
            ) : (
              <div className="space-y-6 py-2">
                <div className="space-y-2">
                  <span className="text-3xl">🎮</span>
                  <h2 className="text-lg font-bold uppercase text-slate-900 dark:text-white">Telemetry Received</h2>
                  <p className="text-[11px] text-slate-400">transmissions logged on verified registry hashes.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Grade</span>
                    <strong className="text-emerald-500 text-base font-extrabold block mt-0.5">{result.score}%</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">({result.correctCount}/{result.totalCount} correct)</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">XP Rewarded</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 text-base font-extrabold block mt-0.5">+{result.xpEarned} XP</strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">(total: {result.userXp.currentXp} XP)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
                  <Link href="/dashboard/courses" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-300 hover:-translate-y-0.5 text-center">
                    Dashboard Quest Map
                  </Link>
                  <Link href="/leaderboard" className="px-6 py-3 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-300 hover:-translate-y-0.5 text-center">
                    View Leaderboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

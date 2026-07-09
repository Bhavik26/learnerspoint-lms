"use client";

import { useState } from "react";
import Link from "next/link";

interface StudentDashboardClientProps {
  enrollments: any[];
  studentName: string;
  studentEmail: string;
  isMocked: boolean;
}

export default function StudentDashboardClient({
  enrollments,
  studentName,
  studentEmail,
  isMocked,
}: StudentDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "courses" | "quizzes" | "certificates">("overview");

  const enrolledCount = enrollments.length;
  const totalMinutes = enrollments.reduce((acc, curr) => acc + Math.round(curr.timeTaken / 60), 0);
  const avgScore = enrolledCount > 0 
    ? (enrollments.reduce((acc, curr) => acc + curr.score, 0) / enrolledCount).toFixed(1)
    : "0.0";
  const certificateCount = enrollments.filter(e => e.certified).length;

  const certifiedEnrollments = enrollments.filter(e => e.certified);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-slate-900 dark:text-slate-100 animate-fade-in space-y-6">
      
      {/* Top Banner Control Header */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">My Learning Panel</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Welcome back, <strong className="text-primary font-bold">{studentName}</strong> ({studentEmail})
          </p>
        </div>

        {isMocked && (
          <div className="text-[10px] font-bold px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400">
            OFFLINE DEMO MODE
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* Left Side: Vertical Sidebar Menu */}
        <div className="md:col-span-1 flex flex-col gap-1.5 p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1.5 border-b border-slate-100 dark:border-slate-900 block mb-2">
            Dashboard Menu
          </span>
          {[
            { id: "overview", label: "Overview", icon: "📈" },
            { id: "courses", label: "My Courses", icon: "📚" },
            { id: "quizzes", label: "Quiz Scores", icon: "🏆" },
            { id: "certificates", label: "Certificates", icon: "🎓" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer flex items-center gap-3 border-l-4 ${
                activeTab === tab.id 
                  ? "bg-primary/5 text-primary border-primary shadow-sm" 
                  : "border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Side: Active Panel Content */}
        <div className="md:col-span-3">
          
          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Metrics cards grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-850 p-5 bg-white dark:bg-slate-950 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Enrolled Tracks</span>
                  <span className="text-2xl font-extrabold tracking-tight block mt-1 text-slate-900 dark:text-white">{enrolledCount}</span>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-850 p-5 bg-white dark:bg-slate-950 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Study</span>
                  <span className="text-2xl font-extrabold tracking-tight block mt-1 text-slate-900 dark:text-white">{totalMinutes} mins</span>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-850 p-5 bg-white dark:bg-slate-950 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Quiz Average</span>
                  <span className="text-2xl font-extrabold tracking-tight block mt-1 text-slate-900 dark:text-white">{avgScore}%</span>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-850 p-5 bg-white dark:bg-slate-950 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Diplomas</span>
                  <span className="text-2xl font-extrabold tracking-tight block mt-1 text-primary">{certificateCount}</span>
                </div>
              </div>

              {/* Graphical Card summary */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-4">
                <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-900 dark:text-white">Active learning milestones</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Complete all modules inside your courses tracks, obtain score above 80% on evaluation quizzes, and claim your placement certificates instantly.
                </p>
                <div className="pt-2">
                  <Link 
                    href="/"
                    className="inline-block px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-all"
                  >
                    Browse New Courses
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: My Courses */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              {enrollments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-850 p-12 text-center space-y-4 bg-white dark:bg-slate-950 shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">You are not enrolled in any modules yet.</p>
                  <Link href="/dashboard" className="inline-block px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-300">
                    Explore Syllabus Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {enrollments.map((e) => (
                    <div 
                      key={e.id} 
                      className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                    >
                      <div className="space-y-3 flex-grow md:max-w-xl">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white uppercase">{e.course.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">{e.course.description}</p>
                        
                        <div className="flex gap-4 text-[10px] font-semibold text-slate-400 pt-1 uppercase tracking-wider">
                          <span>Completed: <strong className="text-slate-700 dark:text-slate-300">{e.progress}%</strong></span>
                          <span>Study Time: <strong className="text-slate-700 dark:text-slate-300">{Math.round(e.timeTaken / 60)} mins</strong></span>
                        </div>

                        <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${e.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto text-xs font-bold shrink-0">
                        <Link 
                          href={`/courses/${e.course.slug}`}
                          className="flex-grow text-center px-4 py-2.5 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 rounded-lg shadow-sm transition-all duration-300"
                        >
                          Continue Lessons
                        </Link>
                        {e.certified ? (
                          <Link 
                            href={`/certificate/${e.id}`}
                            className="flex-grow text-center px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-sm hover:shadow transition-all duration-300"
                          >
                            Get Certificate
                          </Link>
                        ) : (
                          <button 
                            disabled 
                            className="flex-grow text-center px-4 py-2.5 border border-dashed border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-600 rounded-lg cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/50"
                            title="Progress must be 100% to claim certificate"
                          >
                            Locked Certificate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Quiz Scores */}
          {activeTab === "quizzes" && (
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800">
                      <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Course Name</th>
                      <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Average Score</th>
                      <th className="p-4 font-bold uppercase text-slate-450 tracking-wider">Evaluation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-medium">
                    {enrollments.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300">
                        <td className="p-4 font-bold text-slate-900 dark:text-white uppercase">{e.course.title}</td>
                        <td className="p-4 font-extrabold text-slate-800 dark:text-slate-200">{e.score}%</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                            e.score >= 80 
                              ? "border-emerald-200 bg-emerald-50 text-emerald-605 text-emerald-600 dark:bg-emerald-950/20" 
                              : "border-red-205 bg-red-50 text-red-650 dark:bg-red-950/20"
                          }`}>
                            {e.score >= 80 ? "CLEAR" : "FAIL (NEED 80%)"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {enrollments.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-xs text-slate-400 font-medium italic">
                          No study scorecards recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Certificates */}
          {activeTab === "certificates" && (
            <div className="space-y-6">
              {certifiedEnrollments.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/60 border-dashed p-8 text-center text-xs text-slate-400 font-medium italic bg-white dark:bg-slate-950">
                  You have not unlocked any verified certificates yet. Achieve 100% course lesson completion state.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {certifiedEnrollments.map((e) => (
                    <div 
                      key={e.id}
                      className="rounded-2xl border border-emerald-100 dark:border-emerald-950/50 p-5 bg-white dark:bg-slate-950 shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-1">
                        <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">VERIFIED PLACEMENT CREDENTIAL</div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase leading-tight">{e.course.title}</h4>
                        <span className="text-[10px] text-slate-400 font-medium block">Grade Score: {e.score}%</span>
                      </div>
                      <div>
                        <Link 
                          href={`/certificate/${e.id}`}
                          className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold rounded-lg transition-all animate-pulse"
                        >
                          View Certificate
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

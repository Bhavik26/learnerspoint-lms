"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Course } from "@/lib/coursesData";

interface CourseReaderProps {
  course: Course;
  initialEnrollment: {
    progress: number;
    score: number;
    timeTaken: number;
    certified: boolean;
  } | null;
}

export default function CourseReader({ course, initialEnrollment }: CourseReaderProps) {
  const router = useRouter();
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [completedParts, setCompletedParts] = useState<string[]>([]);
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [activeSeconds, setActiveSeconds] = useState(0);

  const [liveSlots, setLiveSlots] = useState<any[]>([]);
  const [recordedSessions, setRecordedSessions] = useState<any[]>([]);
  const [liveDetailsLoading, setLiveDetailsLoading] = useState(true);

  useEffect(() => {
    const fetchLiveDetails = async () => {
      try {
        const res = await fetch(`/api/courses/${course.id}/live-details`);
        if (res.ok) {
          const data = await res.json();
          setLiveSlots(data.liveSlots || []);
          setRecordedSessions(data.recordedSessions || []);
        }
      } catch (err) {
        console.warn("Failed to fetch live course slot configurations:", err);
      } finally {
        setLiveDetailsLoading(false);
      }
    };
    fetchLiveDetails();
  }, [course.id]);

  useEffect(() => {
    if (initialEnrollment) {
      const partsCount = course.modules.length;
      const completedCount = Math.round((initialEnrollment.progress / 100) * partsCount);
      const completedIds = course.modules.slice(0, completedCount).map(p => p.id);
      setCompletedParts(completedIds);
    }
  }, [initialEnrollment, course.modules]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const tracker = setInterval(async () => {
      if (activeSeconds > 0 && initialEnrollment) {
        try {
          const res = await fetch("/api/enrollments/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseId: course.id,
              activeSeconds: 10,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setEnrollment(prev => prev ? {
                ...prev,
                timeTaken: data.enrollment.timeSpentSeconds
              } : null);
            }
          }
        } catch (err) {
          console.warn("Time tracking ping failed. Working in offline mode.");
        }
      }
    }, 10000);

    return () => clearInterval(tracker);
  }, [activeSeconds, course.id, initialEnrollment]);

  const handleTogglePartCompletion = async (partId: string) => {
    let nextCompleted = [...completedParts];
    if (completedParts.includes(partId)) {
      nextCompleted = nextCompleted.filter(id => id !== partId);
    } else {
      nextCompleted.push(partId);
    }
    
    setCompletedParts(nextCompleted);

    const progressPercentage = Math.round((nextCompleted.length / course.modules.length) * 100);
    const aggregateScore = nextCompleted.length > 0 ? parseFloat((85 + (nextCompleted.length * 5)).toFixed(1)) : 0;

    try {
      const res = await fetch("/api/enrollments/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          progressPercentage,
          aggregateScore,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEnrollment({
            progress: data.enrollment.progressPercentage,
            score: data.enrollment.aggregateScore,
            timeTaken: data.enrollment.timeSpentSeconds,
            certified: data.enrollment.isCompleted
          });
          router.refresh();
        }
      }
    } catch (err) {
      console.warn("Completion sync failed. Running in visual client state.");
      setEnrollment(prev => prev ? {
        ...prev,
        progress: progressPercentage,
        score: aggregateScore,
        certified: progressPercentage === 100
      } : {
        progress: progressPercentage,
        score: aggregateScore,
        timeTaken: 120,
        certified: progressPercentage === 100
      });
    }
  };

  const activePart = course.modules[activePartIndex];

  const renderMarkdown = (text: string) => {
    const lines = text.trim().split("\n");
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const code = codeBuffer.join("\n");
          codeBuffer = [];
          elements.push(
            <pre key={`code-${index}`} className="block p-4 my-4 overflow-x-auto whitespace-pre font-mono text-xs max-w-full leading-relaxed bg-slate-950 text-slate-100 rounded-lg shadow-sm border border-slate-800">
              <code>{code}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
        }
        return;
      }
      
      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }
      
      if (line.startsWith("# ")) {
        elements.push(<h1 key={index} className="text-xl font-extrabold tracking-tight mt-6 mb-4 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">{line.substring(2)}</h1>);
      } else if (line.startsWith("## ")) {
        elements.push(<h2 key={index} className="text-base font-bold mt-5 mb-3 text-slate-900 dark:text-white">{line.substring(3)}</h2>);
      } else if (line.startsWith("### ")) {
        elements.push(<h3 key={index} className="font-mono text-xs font-bold mt-4 mb-2 text-slate-700 dark:text-slate-300">{line.substring(4)}</h3>);
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={index} className="ml-6 list-disc text-sm my-1 text-slate-600 dark:text-slate-300 leading-relaxed">
            {line.substring(2)}
          </li>
        );
      } else {
        if (line.includes("`")) {
          const parts = line.split("`");
          elements.push(
            <p key={index} className="text-sm my-3 leading-relaxed text-slate-600 dark:text-slate-300">
              {parts.map((part, i) => (
                i % 2 === 1 ? <code key={i} className="font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">{part}</code> : part
              ))}
            </p>
          );
        } else if (line.trim() === "") {
          elements.push(<div key={index} className="h-2" />);
        } else {
          elements.push(
            <p key={index} className="text-sm my-3 leading-relaxed text-slate-600 dark:text-slate-300">
              {line}
            </p>
          );
        }
      }
    });

    return elements;
  };

  // Calculate course-specific active and upcoming live slots
  const getActiveLiveSlot = () => {
    const now = new Date();
    return liveSlots.find((slot) => {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      return slot.isLive && now >= start && now <= end;
    });
  };

  const getNextScheduledSlot = () => {
    const now = new Date();
    const upcoming = liveSlots
      .filter((s) => new Date(s.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    return upcoming[0] || null;
  };

  const activeLiveSlot = getActiveLiveSlot();
  const nextSlot = getNextScheduledSlot();

  return (
    <div className="grid md:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="md:col-span-1 space-y-4">
        <div className="rounded-xl border border-slate-200/60 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <Link href="/courses" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            ← Back to Catalog
          </Link>
          <div>
            <h2 className="font-extrabold tracking-tight text-sm text-slate-900 dark:text-white truncate">{course.title}</h2>
          </div>
          
          {/* Dynamic timing checking rendering block */}
          {activeLiveSlot ? (
            <Link
              href={`/courses/${course.slug}/live`}
              className="block w-full text-center py-2.5 bg-[#0B58CA] text-white font-extrabold text-xs rounded-lg shadow-sm border border-blue-600 animate-pulse hover:bg-[#0B58CA]/90 transition-all duration-300"
            >
              📹 Join Live Session
            </Link>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3 rounded-lg text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mb-1">Live Classroom</span>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                {nextSlot 
                  ? `Next live lecture scheduled at ${new Date(nextSlot.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`
                  : "No live lectures scheduled"}
              </p>
            </div>
          )}

          {enrollment && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Progress</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{enrollment.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full" style={{ width: `${enrollment.progress}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Quiz Avg: <strong className="text-slate-700 dark:text-slate-300">{enrollment.score}%</strong></span>
                <span>Active: <strong className="text-slate-700 dark:text-slate-300">{Math.round(enrollment.timeTaken / 60)}m</strong></span>
              </div>
            </div>
          )}
        </div>

        <nav className="rounded-xl border border-slate-200/60 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {course.modules.map((part, index) => {
            const isActive = index === activePartIndex;
            const isCompleted = completedParts.includes(part.id);
            return (
              <button
                key={part.id}
                onClick={() => setActivePartIndex(index)}
                className={`w-full text-left p-4 text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  isActive 
                    ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span className="truncate">{part.title}</span>
                {isCompleted && (
                  <span className="text-emerald-500 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                    Done
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {enrollment?.certified && (
          <Link
            href={`/certificate/mock-id-${course.id}`}
            className="block w-full text-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all duration-300 hover:-translate-y-0.5"
          >
            Claim Certificate
          </Link>
        )}
      </div>

      {/* Main Panel */}
      <div className="md:col-span-3 space-y-6">
        {activePart ? (
          <>
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                  MODULE LEVEL {activePartIndex + 1}
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight mt-1 text-slate-900 dark:text-white">
                  {activePart.title}
                </h1>
              </div>
              
              {initialEnrollment ? (
                <button
                  onClick={() => handleTogglePartCompletion(activePart.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-300 border ${
                    completedParts.includes(activePart.id)
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400"
                      : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {completedParts.includes(activePart.id) ? "✓ Completed" : "Mark as Completed"}
                </button>
              ) : (
                <div className="text-xs font-semibold text-slate-400 border border-slate-200/60 dark:border-slate-800 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                  Register to track learning progress
                </div>
              )}
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              {renderMarkdown(activePart.content)}
            </div>
          </div>

          {/* Recorded Sessions Inventory card */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3">
              📹 Recorded Live Sessions Archive
            </h3>
            {recordedSessions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No recorded sessions are currently archived for this course.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recordedSessions.map((session) => (
                  <div key={session.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-[#3DBFF2] hover:underline cursor-pointer">
                        {session.title}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Archived: {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <a
                      href={session.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B58CA] hover:bg-[#0B58CA]/90 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all"
                    >
                      Play Recording
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>) : (
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-12 text-center text-sm font-semibold text-slate-400 bg-white dark:bg-slate-900 shadow-sm">
            Content not found.
          </div>
        )}
      </div>
    </div>
  );
}

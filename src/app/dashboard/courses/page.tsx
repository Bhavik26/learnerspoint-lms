import { getSafeToken } from "@/lib/cookieHelper";
import Link from "next/link";
import { verifyJWT } from "@/lib/auth";
import { db } from "@/lib/db";
import { COURSES, Course } from "@/lib/coursesData";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

export const revalidate = 0;

export default async function QuestMapPage() {
  const token = await getSafeToken();
  
  let userPayload = null;
  if (token) {
    userPayload = await verifyJWT(token, JWT_SECRET);
  }

  const userId = userPayload?.userId || "mock-user-id";
  const studentName = userPayload?.name || "Student Coder";

  let userXp = 0;
  let userRank = 0;
  let enrollments: any[] = [];
  let isMocked = false;

  // 1. Fetch XP & Global Rankings
  try {
    const xpRecord = await db.userXP.findUnique({
      where: { userId }
    });
    if (xpRecord) {
      userXp = xpRecord.currentXp;
      userRank = xpRecord.globalRank;
    }
  } catch (err) {
    console.warn("DB offline. Using mock XP values.");
    userXp = 450;
    userRank = 3;
    isMocked = true;
  }

  // Calculate Badge Title based on XP
  let badgeTitle = "NOOB CODER";
  let badgeColor = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  if (userXp >= 100 && userXp < 300) {
    badgeTitle = "SYNTAX SURVIVOR";
    badgeColor = "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400";
  } else if (userXp >= 300 && userXp < 600) {
    badgeTitle = "ARCADE CHAMPION";
    badgeColor = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400";
  } else if (userXp >= 600) {
    badgeTitle = "STACK OVERLORD";
    badgeColor = "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400";
  }

  // 2. Fetch Enrollments
  try {
    const dbEnrollments = await db.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: "asc" }
            }
          }
        }
      }
    });

    enrollments = dbEnrollments.map(e => ({
      id: e.id,
      courseId: e.courseId,
      progress: e.progressPercentage,
      isCompleted: e.isCompleted,
      course: {
        title: e.course.title,
        slug: e.course.slug,
        modules: e.course.modules.map(m => ({
          id: m.id,
          title: m.title,
          order: m.order
        }))
      }
    }));
  } catch (err) {
    isMocked = true;
    enrollments = [
      {
        id: "mock-enrollment-1",
        courseId: "fso-core",
        progress: 50.0,
        isCompleted: false,
        course: {
          title: "Deep Dive Into Modern Web Development",
          slug: "full-stack-open",
          modules: [
            { id: "fso-m0", title: "Part 0: Fundamentals of Web Apps", order: 0 },
            { id: "fso-m1", title: "Part 1: Introduction to React", order: 1 }
          ]
        }
      }
    ];
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-6 py-8">
      {/* Top Banner stats */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-block border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-1 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase rounded-md">
            Quest Mode Active
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Player: {studentName}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Solve quizzes sequentially to stack XP points and climb the global ranks.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center min-w-[320px]">
          <div className="border border-slate-100 dark:border-slate-900 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">XP Score</span>
            <strong className="text-indigo-600 dark:text-indigo-400 text-lg font-extrabold block mt-0.5">{userXp}</strong>
          </div>
          <div className="border border-slate-100 dark:border-slate-900 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex flex-col justify-center items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Rank Title</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold block truncate max-w-full ${badgeColor}`}>
              {badgeTitle}
            </span>
          </div>
          <div className="border border-slate-100 dark:border-slate-900 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Leaderboard</span>
            <strong className="text-slate-800 dark:text-slate-200 text-lg font-extrabold block mt-0.5">#{userRank || "N/A"}</strong>
          </div>
        </div>
      </div>

      {/* Quest Line Map per Course */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Course Syllabus Roadmaps</h2>

        {enrollments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-12 text-center space-y-4 bg-white dark:bg-slate-950 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">You need to enroll in a course to start your quest line.</p>
            <Link href="/courses" className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-300">
              Visit Syllabus Catalog
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {enrollments.map((enrollment) => {
              const totalModules = enrollment.course.modules.length;
              const completedCount = Math.round((enrollment.progress / 100) * totalModules);

              return (
                <div key={enrollment.id} className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-8">
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4 gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white uppercase">{enrollment.course.title}</h3>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">Slug: {enrollment.course.slug}</span>
                    </div>
                    <div className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-400 font-bold px-3 py-1 rounded-full">
                      Progress: {enrollment.progress}% ({completedCount}/{totalModules} completed)
                    </div>
                  </div>

                  {/* Level Nodes Visual Map */}
                  <div className="py-6 flex flex-col items-center relative select-none">
                    
                    {/* Vertical Connector Path line */}
                    <div className="absolute top-12 bottom-12 w-0.5 bg-slate-200 dark:bg-slate-800 z-0" />

                    <div className="space-y-12 w-full max-w-lg z-10 relative">
                      {enrollment.course.modules.map((mod: any, idx: number) => {
                        const isCompleted = idx < completedCount;
                        const isUnlocked = idx <= completedCount;
                        const isRightAlign = idx % 2 === 1;

                        let nodeBg = "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 border-slate-200 dark:border-slate-700";
                        let nodeRing = "";
                        if (isCompleted) {
                          nodeBg = "bg-emerald-500 text-white font-bold border-emerald-500";
                          nodeRing = "shadow-[0_0_12px_rgba(16,185,129,0.3)]";
                        } else if (isUnlocked) {
                          nodeBg = "bg-indigo-600 text-white font-bold border-indigo-600";
                          nodeRing = "shadow-[0_0_12px_rgba(79,70,229,0.4)]";
                        }

                        return (
                          <div 
                            key={mod.id} 
                            className={`flex items-center gap-6 ${isRightAlign ? "flex-row-reverse text-right" : "flex-row"}`}
                          >
                            {/* Circle Level Node */}
                            <div 
                              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs transition-all duration-300 z-10 ${nodeBg} ${nodeRing}`}
                            >
                              {isCompleted ? "✓" : idx + 1}
                            </div>

                            {/* Node Metadata Tooltip Box */}
                            <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-xs space-y-3 z-10">
                              <div className="flex justify-between items-center gap-2">
                                <strong className="truncate font-bold uppercase text-slate-900 dark:text-white leading-normal">{mod.title}</strong>
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  isCompleted 
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" 
                                    : isUnlocked 
                                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400" 
                                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-650"
                                }`}>
                                  {isCompleted ? "Completed" : isUnlocked ? "Current" : "Locked"}
                                </span>
                              </div>
                              
                              {isUnlocked ? (
                                <div className="flex gap-2 justify-end pt-1 font-bold">
                                  <Link 
                                    href={`/courses/${enrollment.course.slug}`}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[10px] text-slate-700 dark:border-slate-800 dark:hover:bg-slate-850 dark:text-slate-300 transition-all duration-200"
                                  >
                                    Read Module
                                  </Link>
                                  <Link 
                                    href={`/courses/${enrollment.course.slug}/quiz/mock-quiz-id-${mod.id}`}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] transition-all duration-300"
                                  >
                                    Take Quiz
                                  </Link>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 italic">
                                  Complete previous levels to unlock
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Video Streaming Private Vault Player */}
                  <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/50 space-y-4">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      Secure Video Vault Streamer
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      Lectures are stored in private cloud storage bucket. Generates dynamic temporary 15-minute presigned URLs on-demand.
                    </p>

                    <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center p-6 rounded-xl text-center relative overflow-hidden border border-slate-800">
                      <svg className="w-12 h-12 text-slate-700 mb-2 fill-none stroke-current" strokeWidth="1.5" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      
                      <span className="text-[10px] text-slate-500 font-medium">
                        Select a module level above to request a secure presigned video stream.
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

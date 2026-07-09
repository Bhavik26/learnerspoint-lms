import { getSafeToken } from "@/lib/cookieHelper";
import Link from "next/link";
import { verifyJWT } from "@/lib/auth";
import { db } from "@/lib/db";
import { COURSES, Course } from "@/lib/coursesData";
import AddToCartButton from "@/components/AddToCartButton";
import StudentDashboardClient from "@/components/StudentDashboardClient";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

export const revalidate = 0;

export default async function CoursesPage() {
  const token = await getSafeToken();
  
  let userPayload = null;
  if (token) {
    try {
      userPayload = await verifyJWT(token, JWT_SECRET);
    } catch (e) {
      console.warn("Invalid JWT cookie token detected in courses page.");
    }
  }

  // --- CASE A: Authenticated Student (Show Personal Progress Dashboard) ---
  if (userPayload) {
    const studentName = userPayload.name || "Student User";
    const studentEmail = userPayload.email || "student@learnerspoint.com";
    const userId = userPayload.userId;

    let enrollments: any[] = [];
    let isMocked = false;

    try {
      const dbEnrollments = await db.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              modules: true
            }
          }
        }
      });
      
      enrollments = dbEnrollments.map(e => ({
        id: e.id,
        courseId: e.courseId,
        progress: e.progressPercentage,
        score: e.aggregateScore,
        timeTaken: e.timeSpentSeconds,
        certified: e.isCompleted,
        course: {
          title: e.course.title,
          slug: e.course.slug,
          description: e.course.description,
          modulesCount: e.course.modules.length
        }
      }));
    } catch (err) {
      console.warn("DB offline, falling back to mock enrollment details.");
      isMocked = true;
      enrollments = [
        {
          id: "mock-enrollment-1",
          courseId: "fso-core",
          progress: 100,
          score: 95.0,
          timeTaken: 5400,
          certified: true,
          course: {
            title: "Deep Dive Into Modern Web Development",
            slug: "full-stack-open",
            description: "Learn React, Redux, Node.js, PostgreSQL, and TypeScript in one comprehensive, text-first engineering path.",
            modulesCount: 3
          }
        },
        {
          id: "mock-enrollment-2",
          courseId: "nextjs-deepdive",
          progress: 50,
          score: 82.0,
          timeTaken: 1800,
          certified: false,
          course: {
            title: "Next.js Production Architectures",
            slug: "nextjs-deep-dive",
            description: "Master React Server Components (RSC), custom Edge Middlewares, streaming, and database pooling at scale.",
            modulesCount: 3
          }
        }
      ];
    }

    return (
      <StudentDashboardClient 
        enrollments={enrollments}
        studentName={studentName}
        studentEmail={studentEmail}
        isMocked={isMocked}
      />
    );
  }

  // --- CASE B: Unauthenticated Guest (Show Public Course Catalog Grid) ---
  let dbCourses: Course[] = [];
  
  try {
    const list = await db.course.findMany({
      where: { isPublished: true },
      include: {
        modules: true,
        slots: { orderBy: { date: "asc" } }
      },
      orderBy: { title: "asc" }
    });
    
    if (list.length > 0) {
      dbCourses = list.map(c => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        price: c.price,
        isPublished: c.isPublished,
        modules: c.modules.map(m => ({
          id: m.id,
          courseId: m.courseId,
          title: m.title,
          order: m.order,
          content: m.content
        })),
        slots: c.slots.map(s => ({
          id: s.id,
          courseId: s.courseId,
          date: s.date,
          timeWindow: s.timeWindow,
          capacity: s.capacity,
          bookedCount: s.bookedCount
        }))
      }));
    } else {
      dbCourses = COURSES;
    }
  } catch (err) {
    console.warn("DB offline, falling back to local seed data for public view.");
    dbCourses = COURSES;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 font-sans animate-fade-in">
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4 space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">Syllabus Catalog</h1>
        <p className="text-xs text-slate-400 font-medium">Explore professional developer tracks and register online slots.</p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {dbCourses.map((course) => (
          <div 
            key={course.id} 
            className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {course.price === 0 ? (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400">
                    FREE
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:border-emerald-900 dark:text-emerald-400">
                    PREMIUM
                  </span>
                )}
                <span className="text-xs text-slate-400 font-semibold">
                  {course.modules.length} modules
                </span>
                {course.price > 0 && (
                  <span className="text-sm font-extrabold ml-auto text-primary">
                    ₹{course.price.toLocaleString()}
                  </span>
                )}
              </div>

              <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                {course.title}
              </h2>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {course.description}
              </p>

              {/* Available Live Slots */}
              {course.slots && course.slots.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Available Live Slots</span>
                  <div className="flex flex-wrap gap-1">
                    {course.slots.map((s: any, idx: number) => (
                      <span key={idx} className="inline-block rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                        {new Date(s.date).toLocaleDateString()} ({s.timeWindow})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Link 
                href={`/courses/${course.slug}`}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 rounded-lg text-xs font-bold transition-all"
              >
                View Syllabus
              </Link>
              <AddToCartButton courseId={course.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

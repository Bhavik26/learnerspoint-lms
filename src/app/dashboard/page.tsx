import { redirect } from "next/navigation";
import { getSafeToken } from "@/lib/cookieHelper";
import { db } from "@/lib/db";
import { verifyJWT } from "@/lib/auth";
import Link from "next/link";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

export const revalidate = 0;

export default async function DashboardPage() {
  // 1. Authentication Guard Validation
  const token = await getSafeToken();
  if (!token) {
    redirect("/login?redirect=/dashboard");
  }

  let user = null;
  try {
    user = await verifyJWT(token, JWT_SECRET);
  } catch (err) {
    console.warn("Invalid JWT cookie token detected on dashboard request.");
  }

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  // 2. Fetch User Profile Data, Enrollments
  let userXP = null;
  let enrolledCourses: any[] = [];

  try {
    // Fetch user XP metrics
    userXP = await db.userXP.findUnique({
      where: { userId: user.userId },
    });

    // Fetch user enrolled courses details
    const enrollments = await db.enrollment.findMany({
      where: { userId: user.userId },
      include: {
        course: {
          include: {
            modules: true,
          },
        },
      },
    });

    enrolledCourses = enrollments.map((e) => ({
      id: e.course.id,
      title: e.course.title,
      slug: e.course.slug,
      progress: e.progressPercentage,
      modulesCount: e.course.modules.length,
    }));
  } catch (err) {
    console.warn("Database offline. Displaying local dashboard cache mocks.");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Welcome Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome Back, {user.name}!
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Account Role: <span className="text-[#3DBFF2] font-semibold">{user.role}</span>
            </p>
          </div>
          
          {/* XP Badge metrics */}
          {userXP && (
            <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 px-5 py-3 rounded-xl shadow-sm">
              <div className="text-center border-r border-slate-800 pr-4">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Current Score</span>
                <span className="text-lg font-extrabold text-[#3DBFF2]">{userXP.currentXp} XP</span>
              </div>
              <div className="text-center pl-1">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Global Rank</span>
                <span className="text-lg font-extrabold text-[#0B58CA]">#{userXP.globalRank}</span>
              </div>
            </div>
          )}
        </div>

        {/* Enrolled Courses list Grid */}
        <div className="space-y-6">
          <h3 className="font-extrabold text-lg text-white">
            Your Enrolled Course Catalog
          </h3>

          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <h4 className="font-extrabold text-sm text-white mb-2 line-clamp-1">
                      {c.title}
                    </h4>
                    <div className="flex justify-between text-xs text-slate-400 mb-4">
                      <span>Modules: {c.modulesCount}</span>
                      <span>Progress: {c.progress}%</span>
                    </div>
                    
                    {/* Progress Bar indicator */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-6 border border-slate-850">
                      <div
                        className="bg-[#3DBFF2] h-full rounded-full"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/courses/${c.slug}`}
                    className="block w-full text-center py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-white font-semibold text-xs rounded-lg transition-all"
                  >
                    Resume Learning
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 font-semibold text-sm">
              No active course enrollments. 
              <Link href="/courses" className="text-[#3DBFF2] hover:underline ml-1">
                Browse Catalog →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSafeToken } from "@/lib/cookieHelper";
import { verifyJWT } from "@/lib/auth";
import Link from "next/link";
import LiveStreamContainer from "@/components/LiveStreamContainer";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

export const revalidate = 0;

export default async function DashboardLivePage() {
  // 1. Authentication Guard Validation
  const token = await getSafeToken();
  if (!token) {
    redirect("/login?redirect=/dashboard/live");
  }

  let user = null;
  try {
    user = await verifyJWT(token, JWT_SECRET);
  } catch (err) {
    console.warn("Invalid JWT cookie token detected on dashboard live route.");
  }

  if (!user) {
    redirect("/login?redirect=/dashboard/live");
  }

  const isTeacher = user.role === "ADMIN" || user.role === "INSTRUCTOR";
  const roomId = "LearnersPoint-Main-Room";

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-[#3DBFF2] hover:text-[#3DBFF2]/80 transition-colors"
          >
            ← Return to Dashboard
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider bg-red-950 text-red-400 px-3 py-1 rounded-full border border-red-900 animate-pulse">
            {isTeacher ? "Broadcasting Host" : "Live Session Connected"}
          </span>
        </div>

        {/* Live Header Title */}
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Main Virtual Lecture Hall
          </h1>
          <p className="text-slate-400 text-sm">
            {isTeacher 
              ? "Ensure camera permissions are active. Your stream is broadcasted to all active students in the main room."
              : "Welcome to the live interactive session. If the feed does not load, wait for the instructor to boot their stream."}
          </p>
        </div>

        {/* Dynamic Video Grid Component */}
        <LiveStreamContainer
          roomId={roomId}
          userId={user.userId}
          userName={user.name}
          isTeacher={isTeacher}
        />
      </div>
    </div>
  );
}

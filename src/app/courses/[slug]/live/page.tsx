import { notFound, redirect } from "next/navigation";
import { getSafeToken } from "@/lib/cookieHelper";
import { verifyJWT } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import LiveStreamContainer from "@/components/LiveStreamContainer";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

interface LivePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function LiveClassPage({ params }: LivePageProps) {
  const { slug } = await params;

  // 1. Fetch user authentication session details
  const token = await getSafeToken();
  if (!token) {
    redirect(`/login?redirect=/courses/${slug}/live`);
  }

  const user = await verifyJWT(token, JWT_SECRET);
  if (!user) {
    redirect(`/login?redirect=/courses/${slug}/live`);
  }

  // 2. Fetch course details and verify enrollment
  let course = null;
  let enrollment = null;

  try {
    course = await db.course.findUnique({
      where: { slug },
      include: {
        enrollments: {
          where: { userId: user.userId }
        }
      }
    });

    if (course && course.enrollments.length > 0) {
      enrollment = course.enrollments[0];
    }
  } catch (err) {
    console.warn("DB offline. Displaying local cache defaults.");
  }

  if (!course) {
    notFound();
  }

  // Enforce purchase verification (Admins are always whitelisted to broadcast)
  const isTeacher = user.role === "ADMIN" || user.role === "INSTRUCTOR";
  if (!isTeacher && course.price > 0 && !enrollment) {
    redirect(`/courses/${slug}`);
  }

  const roomId = `live-${course.id}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/courses/${slug}`}
            className="text-sm font-semibold text-[#3DBFF2] hover:text-[#3DBFF2]/80 transition-colors"
          >
            ← Return to Course Modules
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider bg-red-950 text-red-400 px-3 py-1 rounded-full border border-red-900 animate-pulse">
            {isTeacher ? "Broadcasting Host" : "Live Session Connected"}
          </span>
        </div>

        {/* Live Header Title */}
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Live Stream: {course.title}
          </h1>
          <p className="text-slate-400 text-sm">
            {isTeacher 
              ? "Ensure camera permissions are active. Your stream is broadcasted to all enrolled students."
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

export async function generateStaticParams() {
  try {
    const { db } = require("@/lib/db");
    const courses = await db.course.findMany({ select: { slug: true } });
    if (courses && courses.length > 0) {
      return courses.map((c: any) => ({ slug: c.slug }));
    }
  } catch (err) {
    // ignore
  }
  const { COURSES } = require("@/lib/coursesData");
  return COURSES.map((c: any) => ({ slug: c.slug }));
}

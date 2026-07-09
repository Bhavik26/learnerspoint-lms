import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { COURSES } from "@/lib/coursesData";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    enrollmentId: string;
  }>;
}

export const revalidate = 0;

export default async function CertificatePage({ params }: PageProps) {
  const { enrollmentId } = await params;
  
  let enrollment = null;
  let user = { name: "Demo Graduate User", email: "grad@learnerspoint.com" };
  let course = COURSES[0];
  let isMocked = false;

  try {
    const dbEnrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: true,
        course: true,
      },
    });

    if (dbEnrollment) {
      enrollment = dbEnrollment;
      user = dbEnrollment.user;
      
      const matchCourse = COURSES.find(c => c.id === dbEnrollment.courseId);
      course = matchCourse || {
        id: dbEnrollment.courseId,
        title: dbEnrollment.course.title,
        slug: dbEnrollment.course.slug,
        description: dbEnrollment.course.description,
        price: 0,
        isPublished: false,
        modules: [],
      };
    }
  } catch (err) {
    console.warn("DB offline. Loading mockup certificate details.");
    isMocked = true;
  }

  if (!enrollment) {
    isMocked = true;
    enrollment = {
      id: enrollmentId,
      progressPercentage: 100.0,
      aggregateScore: 94.8,
      timeSpentSeconds: 5400,
      isCompleted: true,
      enrolledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };
  }

  if (enrollment.progressPercentage < 100) {
    return (
      <div className="max-w-md mx-auto my-12 px-6">
        <div className="rounded-2xl border border-slate-200/60 p-6 text-center space-y-4 bg-white dark:bg-slate-950 shadow-sm">
          <div className="text-red-500 font-extrabold uppercase text-xs tracking-wider bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 inline-block px-3 py-1 rounded-full">
            Access Denied
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            This certificate is not active. The student progress is currently at {enrollment.progressPercentage}%, which does not meet the 100% completion requirement.
          </p>
          <Link href="/dashboard" className="inline-block text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const verificationHash = Buffer.from(`${enrollmentId}:${user.email}:${course.id}`).toString("base64").substring(0, 24);

  return (
    <div className="max-w-3xl mx-auto my-12 px-6 space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="rounded-3xl border-8 border-double border-indigo-600 bg-white dark:bg-slate-950 p-8 md:p-12 text-center space-y-8 relative overflow-hidden select-none shadow-sm">
        
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
          <span className="font-extrabold text-9xl uppercase tracking-widest rotate-12">
            VERIFIED
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            LearnersPoint Academy Credential
          </div>
          <div className="h-0.5 bg-slate-200 dark:bg-slate-800 w-24 mx-auto" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
            Certificate of Completion
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
            This is to certify that the student named below has successfully completed all coursework, exercises, and exams.
          </p>
        </div>

        <div className="py-4">
          <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-2 font-bold">This credential is awarded to</span>
          <div className="text-2xl md:text-3xl font-extrabold border-b border-slate-200 dark:border-slate-800 inline-block px-8 py-1.5 text-indigo-600 dark:text-indigo-400">
            {user.name}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">({user.email})</span>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">For completing the intensive course</span>
          <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white uppercase">
            &quot;{course.title}&quot;
          </h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed font-medium">
            A comprehensive, rigorous software engineering syllabus verified by automatic code challenges.
          </p>
        </div>

        <div className="grid grid-cols-3 border-t border-b border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:border-slate-800 py-3.5 max-w-md mx-auto text-center text-xs font-bold">
          <div>
            <span className="text-[9px] text-slate-450 text-slate-400 block uppercase">Grade</span>
            <strong className="text-indigo-650 dark:text-indigo-400 text-sm block mt-0.5">{enrollment.aggregateScore}%</strong>
          </div>
          <div>
            <span className="text-[9px] text-slate-450 text-slate-400 block uppercase">Active Study</span>
            <strong className="text-slate-800 dark:text-slate-200 text-sm block mt-0.5">{Math.round(enrollment.timeSpentSeconds / 60)} min</strong>
          </div>
          <div>
            <span className="text-[9px] text-slate-450 text-slate-400 block uppercase">Status</span>
            <strong className="text-emerald-500 text-sm block mt-0.5">VERIFIED</strong>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 max-w-xl mx-auto text-xs font-semibold">
          <div className="text-left space-y-1">
            <span className="text-[9px] text-slate-400 uppercase block font-bold">Issue Date</span>
            <span className="text-slate-700 dark:text-slate-300">{enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
          </div>
          <div className="text-center sm:text-right space-y-1">
            <span className="text-[9px] text-slate-400 uppercase block font-bold">Authority Signature</span>
            <span className="font-serif italic text-xs text-slate-700 dark:text-slate-300">LP Board of Directors</span>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 text-[9px] text-slate-400 text-left space-y-1 font-semibold">
          <div className="flex justify-between flex-wrap gap-2 uppercase tracking-wide">
            <span>Credential ID: <span className="text-slate-700 dark:text-slate-300 font-bold">{enrollmentId}</span></span>
            <span>Verification Hash: <span className="text-slate-700 dark:text-slate-300 font-bold">{verificationHash}</span></span>
          </div>
          <p className="text-center text-[8px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-900 font-medium">
            Securely generated by LearnersPoint Academy. Verify authenticity at: learnerspoint.com/verify/{enrollmentId}
          </p>
        </div>

      </div>

      <div className="flex justify-between items-center text-xs font-bold">
        <Link href="/dashboard" className="text-indigo-650 dark:text-indigo-400 hover:underline">
          ← Back to Dashboard
        </Link>
        {isMocked && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full font-bold">
            Demo Fallback Active
          </span>
        )}
        <button 
          onClick={() => window.print()}
          className="rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 px-4 py-2 cursor-pointer shadow-sm hover:shadow transition-all duration-300"
        >
          Print Certificate
        </button>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return [{ enrollmentId: "mock-enrollment-id" }];
}

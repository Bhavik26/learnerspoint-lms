import { notFound } from "next/navigation";
import { getSafeToken } from "@/lib/cookieHelper";
import { verifyJWT } from "@/lib/auth";
import { db } from "@/lib/db";
import { COURSES, Course } from "@/lib/coursesData";
import CourseReader from "@/components/CourseReader";
import CourseDetailPaywallClient from "@/components/CourseDetailPaywallClient";
import Link from "next/link";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  let course: Course | null = null;
  
  // 1. Fetch course by slug from database
  try {
    const dbCourse = await db.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { order: "asc" }
        },
        slots: {
          orderBy: { date: "asc" }
        }
      }
    });
    
    if (dbCourse) {
      course = {
        id: dbCourse.id,
        title: dbCourse.title,
        slug: dbCourse.slug,
        description: dbCourse.description,
        price: dbCourse.price,
        isPublished: dbCourse.isPublished,
        modules: dbCourse.modules.map(m => ({
          id: m.id,
          courseId: m.courseId,
          title: m.title,
          order: m.order,
          content: m.content
        })),
        slots: dbCourse.slots.map(s => ({
          id: s.id,
          courseId: s.courseId,
          date: s.date.toISOString(),
          timeWindow: s.timeWindow
        }))
      };
    } else {
      course = COURSES.find(c => c.slug === slug) || null;
    }
  } catch (err) {
    console.warn("DB offline, falling back to local seed data for course detail view.");
    course = COURSES.find(c => c.slug === slug) || null;
  }

  if (!course) {
    notFound();
  }

  const token = await getSafeToken();
  
  let user = null;
  let enrollment = null;
  
  if (token) {
    const payload = await verifyJWT(token, JWT_SECRET);
    if (payload) {
      user = {
        id: payload.userId,
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        role: payload.role,
      };
      try {
        enrollment = await db.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: payload.userId,
              courseId: course.id,
            },
          },
        });
      } catch (err) {
        console.warn("DB offline, unable to check enrollment. Serving local guest details.");
      }
    }
  }

  if (course.price > 0 && !enrollment) {
    return <CourseDetailPaywallClient course={course} user={user} />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-6 py-8">
      <CourseReader 
        course={course} 
        initialEnrollment={
          enrollment
            ? {
                progress: enrollment.progressPercentage,
                score: enrollment.aggregateScore,
                timeTaken: enrollment.timeSpentSeconds,
                certified: enrollment.isCompleted,
              }
            : null
        }
      />
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

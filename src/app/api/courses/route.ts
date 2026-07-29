import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { COURSES } from "@/lib/coursesData";

export async function GET() {
  try {
    const dbCourses = await db.course.findMany({
      where: { isPublished: true },
      orderBy: { title: "asc" }
    });

    if (dbCourses.length > 0) {
      return NextResponse.json({
        success: true,
        courses: dbCourses.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description,
          price: c.price,
          category: c.category || "DEVELOPMENT",
        }))
      });
    }
  } catch (err) {
    console.warn("DB offline inside /api/courses. Returning local catalog fallbacks.");
  }

  // Fallback local courses data if DB connection is offline
  const formattedCourses = COURSES.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    price: c.price,
    category: c.category || "DEVELOPMENT",
  }));

  return NextResponse.json({
    success: true,
    courses: formattedCourses
  });
}

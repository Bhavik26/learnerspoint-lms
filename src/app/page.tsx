import { getSafeToken } from "@/lib/cookieHelper";
import { db } from "@/lib/db";
import { COURSES } from "@/lib/coursesData";
import { verifyJWT } from "@/lib/auth";
import HomepageClient from "@/components/HomepageClient";

import { Suspense } from "react";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";


export default async function Homepage() {
  const token = await getSafeToken();
  
  let user = null;
  if (token) {
    try {
      const payload = await verifyJWT(token, JWT_SECRET);
      if (payload) {
        user = {
          id: payload.userId,
          name: payload.name || payload.email.split("@")[0],
          email: payload.email,
          role: payload.role,
        };
      }
    } catch (err) {
      console.warn("Invalid JWT cookie token detected on homepage lookup.");
    }
  }

  let activeCourses = [];

  try {
    const dbCourses = await db.course.findMany({
      where: { isPublished: true },
      include: {
        modules: true,
        slots: true,
      },
      orderBy: { title: "asc" }
    });

    if (dbCourses.length > 0) {
      activeCourses = dbCourses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        price: c.price,
        modulesCount: c.modules.length,
        slotsCount: c.slots.length,
      }));
    } else {
      throw new Error("No courses found in database.");
    }
  } catch (err) {
    console.warn("Database offline. Displaying local courses fallbacks.");
    activeCourses = COURSES.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      price: c.price,
      modulesCount: c.modules.length,
      slotsCount: c.slots ? c.slots.length : 0,
    }));
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-lg text-gray-500">Loading LearnersPoint...</div>}>
      <HomepageClient initialCourses={activeCourses} user={user} />
    </Suspense>
  );
}

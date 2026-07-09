import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const role = request.headers.get("x-user-role");
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const courses = await db.course.findMany({
      include: {
        modules: { orderBy: { order: "asc" } },
        slots: { orderBy: { date: "asc" } }
      },
      orderBy: { title: "asc" }
    });
    return NextResponse.json({ success: true, courses });
  } catch (err) {
    console.error("Failed to fetch admin courses:", err);
    return NextResponse.json({ success: true, courses: [] });
  }
}

export async function POST(request: Request) {
  const role = request.headers.get("x-user-role");
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, slug, price, description, category, modules = [], slots = [] } = body;

    if (!title || !slug || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for unique slug
    const existing = await db.course.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json({ error: "A course with this unique slug already exists." }, { status: 400 });
    }

    const newCourse = await (db.course as any).create({
      data: {
        title,
        slug,
        price: parseFloat(price.toString()) || 0,
        description,
        isPublished: true,
        category: category || "DEVELOPMENT",
        modules: {
          create: modules.map((m: any) => ({
            title: m.title,
            order: parseInt(m.order.toString()),
            content: m.content || "",
          })),
        },
        slots: {
          create: slots.map((s: any) => ({
            date: new Date(s.date),
            timeWindow: s.timeWindow || "9:00 AM - 11:00 AM",
            capacity: 30,
            bookedCount: 0,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, courseId: newCourse.id });
  } catch (err: any) {
    console.error("Admin course creation API error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const role = request.headers.get("x-user-role");
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, title, slug, price, description, category, modules = [], slots = [] } = body;

    if (!id || !title || !slug || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      // 1. Update Core Course
      await (tx.course as any).update({
        where: { id },
        data: {
          title,
          slug,
          price: parseFloat(price.toString()) || 0,
          description,
          category: category || "DEVELOPMENT",
        }
      });

      // 2. Re-compile Modules
      await tx.module.deleteMany({ where: { courseId: id } });
      for (const m of modules) {
        await tx.module.create({
          data: {
            courseId: id,
            title: m.title,
            order: parseInt(m.order.toString()),
            content: m.content || "",
          }
        });
      }

      // 3. Re-compile Calendar Slots
      await tx.courseSlot.deleteMany({ where: { courseId: id } });
      for (const s of slots) {
        await tx.courseSlot.create({
          data: {
            courseId: id,
            date: new Date(s.date),
            timeWindow: s.timeWindow || "9:00 AM - 11:00 AM",
            capacity: 30,
            bookedCount: 0,
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin course update API error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const role = request.headers.get("x-user-role");
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId parameter" }, { status: 400 });
    }

    await db.course.delete({
      where: { id: courseId }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin course deletion API error:", err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const role = request.headers.get("x-user-role");
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const students = await db.user.findMany({
      where: { role: "STUDENT" },
      include: {
        userXP: true,
        enrollments: {
          include: { course: true }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ success: true, students });
  } catch (err) {
    console.error("Failed to fetch admin students data:", err);
    return NextResponse.json({ success: true, students: [] });
  }
}

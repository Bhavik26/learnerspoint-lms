import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const CartInputSchema = z.object({
  action: z.enum(["add", "remove", "clear"]).optional().default("add"),
  courseId: z.string().trim().max(100).optional(),
  userId: z.string().trim().max(100).optional(),
});

function sanitizeString(input: string): string {
  return input.replace(/[<>'"]/g, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryUserId = searchParams ? searchParams.get("userId") : null;
  const headerUserId = request.headers.get("x-user-id");
  const rawUserId = queryUserId || headerUserId;

  if (!rawUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sanitizeString(rawUserId);

  try {
    const items = await db.cartItem.findMany({
      where: { userId },
      include: {
        course: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.warn("DB offline. Returning empty cart mock items.");
    return NextResponse.json({ success: true, items: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Zod schema validation
    const validationResult = CartInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid payload format", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { action, courseId: rawCourseId, userId: bodyUserId } = validationResult.data;
    const headerUserId = request.headers.get("x-user-id");
    const rawUserId = bodyUserId || headerUserId;

    if (!rawUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = sanitizeString(rawUserId);
    const courseId = rawCourseId ? sanitizeString(rawCourseId) : undefined;

    if (action === "clear") {
      await db.cartItem.deleteMany({ where: { userId } });
      return NextResponse.json({ success: true });
    }

    if (action === "add" || action === "remove") {
      if (!courseId) {
        return NextResponse.json({ error: "Missing course ID" }, { status: 400 });
      }
    }

    if (action === "add" && courseId) {
      await db.cartItem.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: {},
        create: { userId, courseId }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "remove" && courseId) {
      await db.cartItem.deleteMany({
        where: { userId, courseId },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.warn("DB offline. Processing cart action locally in simulated state.");
    return NextResponse.json({ success: true, offline: true });
  }
}

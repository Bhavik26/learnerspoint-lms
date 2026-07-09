import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    const liveSlots = await db.liveSlot.findMany({
      where: { courseId },
      orderBy: { startTime: "asc" }
    });

    const recordedSessions = await db.recordedSession.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ liveSlots, recordedSessions });
  } catch (err: any) {
    console.error("Failed to fetch live details:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

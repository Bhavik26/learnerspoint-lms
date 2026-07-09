import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, isStreaming, recordingUrl } = body;

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId parameter" }, { status: 400 });
    }

    // Update LiveSession state
    const session = await db.liveSession.update({
      where: { roomId },
      data: {
        isStreaming: isStreaming !== undefined ? isStreaming : false,
        recordingUrl: recordingUrl || null,
      },
    });

    console.log(`[Webhook Archive] Successfully archived room ${roomId} recording:`, recordingUrl);
    
    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error("Webhook archive error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

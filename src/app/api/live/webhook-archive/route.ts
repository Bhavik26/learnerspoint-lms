import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rateLimit";

const WebhookArchiveSchema = z.object({
  roomId: z.string().trim().min(1, "Missing roomId parameter").max(100),
  isStreaming: z.boolean().optional(),
  recordingUrl: z.string().trim().max(500).optional().nullable(),
});

function sanitizeString(input: string): string {
  return input.replace(/[<>'"]/g, "");
}

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous-live";
    const rateCheck = checkRateLimit(`live-webhook-${clientIp}`, 10, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 10 requests per minute allowed." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validationResult = WebhookArchiveSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: "Missing roomId parameter" }, { status: 400 });
    }

    const { roomId: rawRoomId, isStreaming, recordingUrl: rawRecordingUrl } = validationResult.data;
    const roomId = sanitizeString(rawRoomId);
    const recordingUrl = rawRecordingUrl ? sanitizeString(rawRecordingUrl) : null;

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

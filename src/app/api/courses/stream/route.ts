import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { s3Client, BUCKET_NAME } from "@/lib/aws";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const assetKey = searchParams.get("assetKey");

  if (!courseId || !assetKey) {
    return NextResponse.json(
      { error: "Missing required query parameters: courseId or assetKey" },
      { status: 400 }
    );
  }

  try {
    let enrollment = null;
    try {
      enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });
    } catch (dbErr: any) {
      console.error("AWS RDS PostgreSQL connection failed:", dbErr.message);
      return NextResponse.json(
        {
          error: "Database Connection Failure",
          code: "RDS_CONNECTION_ERROR",
          message: "Unable to reach database services. Please check your RDS cluster status.",
        },
        { status: 503 }
      );
    }

    if (!enrollment) {
      return NextResponse.json(
        { error: "Access Denied. You must purchase or enroll in this course first." },
        { status: 403 }
      );
    }

    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: assetKey,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

      return NextResponse.json({
        success: true,
        streamUrl: presignedUrl,
        expiresInSeconds: 900,
      });
    } catch (s3Err: any) {
      console.error("AWS S3 signed link generation failed:", s3Err.message);
      return NextResponse.json(
        {
          error: "Cloud Storage Signature Failure",
          code: "AWS_S3_SIGNING_ERROR",
          message: "The server failed to construct a secure temporary asset request link. Check bucket permissions.",
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("Streaming endpoint unexpected exception:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        code: "UNEXPECTED_SERVER_ERROR",
        message: error.message || "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}

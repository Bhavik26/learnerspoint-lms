import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyJWT } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!token) {
      // Fallback check cookie
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(/token=([^;]+)/);
        if (match) {
          token = match[1];
        }
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized. Token missing." }, { status: 401 });
    }

    const payload = await verifyJWT(token, JWT_SECRET);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Unauthorized. Invalid or expired token." }, { status: 401 });
    }

    let user = null;
    try {
      user = await db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (dbErr) {
      console.warn("DB lookup failed during /api/auth/me. Using JWT payload fallback.", dbErr);
    }

    if (!user) {
      user = {
        id: payload.userId,
        name: payload.name || "Authenticated User",
        email: payload.email || "",
        role: payload.role || "STUDENT",
      };
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

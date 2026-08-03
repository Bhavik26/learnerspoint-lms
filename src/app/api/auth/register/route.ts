import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signJWT } from "@/lib/auth";
import { generateCaptchaSignature } from "../captcha/route";

import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, captchaId, captchaAnswer, captchaSignature } = body;
    const clientPlatform = request.headers.get("x-client-platform") || "";
    const isMobile = clientPlatform === "android" || clientPlatform === "ios";

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isMobile) {
      if (!captchaId || !captchaAnswer || !captchaSignature) {
        return NextResponse.json({ error: "Missing Captcha validation fields" }, { status: 400 });
      }
      const expectedSignature = await generateCaptchaSignature(captchaId, captchaAnswer, JWT_SECRET);
      if (expectedSignature !== captchaSignature) {
        return NextResponse.json({ error: "Incorrect Captcha solution. Please try again." }, { status: 400 });
      }
    }
    
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const existingPhone = await db.user.findFirst({
      where: { phone },
    });

    if (existingPhone) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 400 });
    }
    
    const passwordHash = await hashPassword(password);
    
    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role: Role.STUDENT,
      },
    });
    
    const token = await signJWT(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      JWT_SECRET
    );
    
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
    
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    
    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

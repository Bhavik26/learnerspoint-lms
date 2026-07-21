import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me-in-production-123456789";

const protectedRoutes = [
  "/dashboard",
  "/certificate",
  "/checkout",
  "/api/enrollments",
  "/admin",
  "/api/admin",
  "/api/cart",
  "/api/quizzes",
  "/api/payment",
  "/api/courses",
  "/api/live",
  "/api/ai-chat"
];

const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = [
    "http://localhost",
    "capacitor://localhost",
    "http://localhost:3000",
    "http://192.168.1.102:3000",
    "http://10.198.70.2:3000",
    "http://10.0.2.2:3000"
  ];
  const isAllowedOrigin = allowedOrigins.includes(origin) || 
                          origin.startsWith("http://localhost:") || 
                          origin.startsWith("http://192.168.") ||
                          origin.startsWith("http://10.") ||
                          origin.endsWith(".amazonaws.com");

  // Handle CORS OPTIONS preflight requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");
    }
    return response;
  }

  // Token extraction from cookie or Bearer header
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const token = request.cookies.get("token")?.value || bearerToken;

  let payload: any = null;
  if (token) {
    payload = await verifyJWT(token, JWT_SECRET);
  }

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  let response: NextResponse;

  if (isProtectedRoute) {
    if (!payload) {
      if (pathname.startsWith("/api/")) {
        response = new NextResponse(
          JSON.stringify({ error: "Unauthorized. Please log in." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      } else {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        response = NextResponse.redirect(loginUrl);
      }
    } else {
      if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && payload.role !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          response = new NextResponse(
            JSON.stringify({ error: "Forbidden. Admin access required." }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        } else {
          response = NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } else {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-id", payload.userId);
        requestHeaders.set("x-user-email", payload.email);
        requestHeaders.set("x-user-role", payload.role);

        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
    }
  } else if (isAuthRoute) {
    if (payload) {
      response = NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      response = NextResponse.next();
    }
  } else {
    response = NextResponse.next();
  }

  // Inject CORS and Security Headers on response
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/certificate/:path*",
    "/checkout/:path*",
    "/api/:path*",
    "/admin/:path*",
    "/login",
    "/register"
  ],
};

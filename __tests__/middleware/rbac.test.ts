/** @jest-environment node */
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth";

jest.mock("@/lib/auth", () => ({
  verifyJWT: jest.fn(),
}));

describe("RBAC Security Middleware Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (pathname: string, token?: string): NextRequest => {
    const url = `http://localhost${pathname}`;
    const headers = new Headers();
    if (token) {
      headers.set("cookie", `token=${token}`);
    }
    return new NextRequest(url, { headers });
  };

  it("should block unauthenticated guest on protected page views by redirecting to /login", async () => {
    (verifyJWT as jest.Mock).mockResolvedValue(null);
    const req = createMockRequest("/admin/courses/new");

    const res = await middleware(req);
    expect(res).toBeDefined();
    expect(res!.status).toBe(307);
    expect(res!.headers.get("location")).toContain("/login?callbackUrl=%2Fadmin%2Fcourses%2Fnew");
  });

  it("should block unauthenticated guest on protected API routes by returning 401 status", async () => {
    (verifyJWT as jest.Mock).mockResolvedValue(null);
    const req = createMockRequest("/api/admin/courses");

    const res = await middleware(req);
    expect(res).toBeDefined();
    expect(res!.status).toBe(401);
    const data = await res!.json();
    expect(data.error).toContain("Please log in");
  });

  it("should block student sessions on admin page views by redirecting to /dashboard", async () => {
    (verifyJWT as jest.Mock).mockResolvedValue({
      userId: "user-123",
      email: "student@test.com",
      role: "STUDENT",
    });
    const req = createMockRequest("/admin/students", "mock-student-token");

    const res = await middleware(req);
    expect(res).toBeDefined();
    expect(res!.status).toBe(307);
    expect(res!.headers.get("location")).toContain("/dashboard");
  });

  it("should block student sessions on admin API routes by returning 403 status", async () => {
    (verifyJWT as jest.Mock).mockResolvedValue({
      userId: "user-123",
      email: "student@test.com",
      role: "STUDENT",
    });
    const req = createMockRequest("/api/admin/students", "mock-student-token");

    const res = await middleware(req);
    expect(res).toBeDefined();
    expect(res!.status).toBe(403);
    const data = await res!.json();
    expect(data.error).toContain("Admin access required");
  });
});

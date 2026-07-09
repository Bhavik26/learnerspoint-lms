/** @jest-environment node */
import { POST } from "@/app/api/admin/courses/route";
import { db } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  db: {
    course: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("POST /api/admin/courses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 403 status if x-user-role header is not ADMIN", async () => {
    const request = new Request("http://localhost/api/admin/courses", {
      method: "POST",
      headers: {
        "x-user-role": "STUDENT",
      },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain("Admin access required");
  });

  it("should return 400 status if required fields are missing", async () => {
    const request = new Request("http://localhost/api/admin/courses", {
      method: "POST",
      headers: {
        "x-user-role": "ADMIN",
      },
      body: JSON.stringify({
        title: "Test Course",
        // missing slug and description
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Missing required fields");
  });

  it("should return 400 if slug is not unique", async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: "existing-id" });

    const request = new Request("http://localhost/api/admin/courses", {
      method: "POST",
      headers: {
        "x-user-role": "ADMIN",
      },
      body: JSON.stringify({
        title: "Test Course",
        slug: "existing-slug",
        description: "Test description",
        price: 1999,
        category: "BUSINESS",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("already exists");
  });

  it("should successfully process and create course with valid parameters and category typecast", async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);
    (db.course.create as jest.Mock).mockResolvedValue({ id: "new-course-id" });

    const request = new Request("http://localhost/api/admin/courses", {
      method: "POST",
      headers: {
        "x-user-role": "ADMIN",
      },
      body: JSON.stringify({
        title: "Test Course",
        slug: "new-slug",
        description: "Test description",
        price: 1999,
        category: "CYBERSECURITY",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.courseId).toBe("new-course-id");
    expect(db.course.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: "CYBERSECURITY",
        }),
      })
    );
  });
});

/** @jest-environment node */
import { POST } from "@/app/api/enrollments/unlock/route";
import { db } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  db: {
    course: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(db)),
    payment: {
      create: jest.fn(),
    },
    purchasedCourse: {
      create: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
  },
}));

describe("POST /api/enrollments/unlock (Razorpay payment mapping)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 Unauthorized if x-user-id header is missing", async () => {
    const request = new Request("http://localhost/api/enrollments/unlock", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain("Unauthorized");
  });

  it("should return 400 if courseIds/courseId or paymentReference is missing", async () => {
    const request = new Request("http://localhost/api/enrollments/unlock", {
      method: "POST",
      headers: { "x-user-id": "user-123" },
      body: JSON.stringify({
        paymentReference: "",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Missing required fields");
  });

  it("should create payment, purchasedCourse, enrollment and clear cart items for multiple courses in a transaction", async () => {
    const mockUserId = "user-123";
    const mockCourseIds = ["course-1", "course-2"];
    const mockRef = "razorpay_order_123";

    (db.course.findMany as jest.Mock).mockResolvedValue([
      { id: "course-1", price: 1999 },
      { id: "course-2", price: 2999 },
    ]);

    (db.payment.create as jest.Mock).mockResolvedValue({ id: "payment-123" });
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request("http://localhost/api/enrollments/unlock", {
      method: "POST",
      headers: { "x-user-id": mockUserId },
      body: JSON.stringify({
        courseIds: mockCourseIds,
        paymentReference: mockRef,
        paymentMethod: "UPI_INTENT",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify transaction operations occurred
    expect(db.$transaction).toHaveBeenCalled();
    expect(db.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: mockUserId,
          amount: 4998,
          gatewayOrderId: mockRef,
          method: "UPI_INTENT",
        }),
      })
    );

    // Verify bought courses map
    expect(db.purchasedCourse.create).toHaveBeenCalledTimes(2);
    // Verify enrollments created
    expect(db.enrollment.create).toHaveBeenCalledTimes(2);
    // Verify cart items deleted
    expect(db.cartItem.deleteMany).toHaveBeenCalledTimes(2);
  });
});

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { COURSES } from "@/lib/coursesData";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { courseId, courseIds, paymentReference, paymentMethod, currency = "INR" } = body;

    // Normalize into array of course IDs
    let targetCourseIds: string[] = [];
    if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
      targetCourseIds = courseIds;
    } else if (courseId) {
      targetCourseIds = [courseId];
    }

    if (targetCourseIds.length === 0 || !paymentReference) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Resolve prices from database or fallbacks
    let resolvedCourses: Array<{ id: string; price: number }> = [];
    try {
      const dbCourses = await db.course.findMany({
        where: { id: { in: targetCourseIds } },
        select: { id: true, price: true }
      });
      resolvedCourses = dbCourses;
    } catch (err) {
      console.warn("DB offline. Using static fallback pricing.");
    }

    // If db returned fewer items or was offline, complete list using fallback static configurations
    for (const cid of targetCourseIds) {
      if (!resolvedCourses.some(rc => rc.id === cid)) {
        const fallback = COURSES.find(c => c.id === cid);
        resolvedCourses.push({
          id: cid,
          price: fallback ? fallback.price : 4999.00
        });
      }
    }

    const totalAmount = resolvedCourses.reduce((acc, c) => acc + c.price, 0);

    // Map string paymentMethod to Prisma Enum
    let method: PaymentMethod = PaymentMethod.CREDIT_DEBIT_CARD;
    if (paymentMethod === "UPI_INTENT") method = PaymentMethod.UPI_INTENT;
    if (paymentMethod === "DYNAMIC_QR") method = PaymentMethod.DYNAMIC_QR;

    try {
      await db.$transaction(async (tx) => {
        // 1. Create central payment record
        const payment = await tx.payment.create({
          data: {
            userId,
            amount: totalAmount,
            currency,
            status: PaymentStatus.SUCCESSFUL,
            gatewayOrderId: paymentReference,
            gatewayPaymentId: `pay_mock_${Math.random().toString(36).substring(2, 10)}`,
            method
          }
        });

        // 2. Create PurchasedCourse mappings
        for (const rc of resolvedCourses) {
          await tx.purchasedCourse.create({
            data: {
              paymentId: payment.id,
              courseId: rc.id
            }
          });
        }

        // 3. Create Enrollments and clear cart items
        for (const rc of resolvedCourses) {
          // Avoid key violations if enrollment exists
          const existingEnrollment = await tx.enrollment.findUnique({
            where: {
              userId_courseId: { userId, courseId: rc.id }
            }
          });

          if (!existingEnrollment) {
            await tx.enrollment.create({
              data: {
                userId,
                courseId: rc.id,
                progressPercentage: 0.0,
                aggregateScore: 0.0,
                timeSpentSeconds: 0,
                isCompleted: false,
              }
            });
          }

          // Delete from Cart
          await tx.cartItem.deleteMany({
            where: { userId, courseId: rc.id }
          });
        }
      });

      return NextResponse.json({ success: true });
    } catch (dbErr) {
      console.warn("DB offline. Performing simulated premium multi-course unlocks.", dbErr);
      return NextResponse.json({ success: true, mocked: true });
    }
  } catch (error) {
    console.error("Unlock API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
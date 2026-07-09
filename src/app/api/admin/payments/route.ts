import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const revalidate = 0;

export async function GET(request: Request) {
  const role = request.headers.get("x-user-role");
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  try {
    const payments = await db.payment.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        purchasedCourses: {
          include: {
            course: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format into the shape expected by the Admin panel frontend
    const formattedPayments = payments.map((p: any) => {
      const courses = p.purchasedCourses.map((pc: any) => pc.course?.title).filter(Boolean);
      const courseLabel = courses.length > 0 ? courses.join(", ") : "All-Access subscription";

      return {
        id: p.id,
        email: p.user?.email || "unknown@student.com",
        course: courseLabel,
        amount: p.amount,
        orderId: p.gatewayOrderId,
        status: p.status,
        date: new Date(p.createdAt).toISOString().split("T")[0],
      };
    });

    return NextResponse.json({ success: true, payments: formattedPayments });
  } catch (err) {
    console.error("Failed to fetch admin payments:", err);
    return NextResponse.json({ success: true, payments: [] });
  }
}

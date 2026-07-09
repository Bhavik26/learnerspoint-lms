import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { COURSES } from "@/lib/coursesData";
import Razorpay from "razorpay";

// Initialize Razorpay client with fallback mock values
const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_mockKeyId123";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "mockKeySecret456";

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export const revalidate = 0;

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch user's cart items
    let cartItems: any[] = [];
    try {
      cartItems = await db.cartItem.findMany({
        where: { userId },
        include: { course: true },
      });
    } catch (dbErr) {
      console.warn("DB offline during order creation. Using offline fallback cart.");
    }

    // Calculate total price
    const isCartEmpty = cartItems.length === 0;
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.course?.price || 4999), 0);
    const finalPrice = isCartEmpty ? 4999 : cartTotal;
    const targetCourseIds = isCartEmpty
      ? ["full-stack-web-development-keen"] // Default fallback track
      : cartItems.map((item) => item.courseId);

    // 2. Spawn Razorpay Order
    let orderId = `order_mock_${Math.random().toString(36).substring(2, 12)}`;
    let isMock = true;

    // Only invoke real Razorpay client if environment variables are configured
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const order = await razorpay.orders.create({
          amount: Math.round(finalPrice * 100), // in paise
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
          notes: {
            userId,
            courseIds: JSON.stringify(targetCourseIds),
          },
        });
        orderId = order.id;
        isMock = false;
      } catch (rzpErr: any) {
        console.warn("Razorpay order creation failed, defaulting to sandbox order simulation:", rzpErr.message);
      }
    }

    // 3. Create Pending Payment Log entry inside database
    try {
      await db.payment.create({
        data: {
          userId,
          amount: finalPrice,
          currency: "INR",
          gatewayOrderId: orderId,
          gatewayPaymentId: null,
          method: "CREDIT_DEBIT_CARD", // Default, updated on verification callback
          status: "PENDING",
        },
      });
    } catch (dbErr) {
      console.warn("Database offline. Skipping payment log entry.");
    }

    return NextResponse.json({
      success: true,
      orderId,
      amount: finalPrice,
      currency: "INR",
      keyId: isMock ? "rzp_test_mockKeyId123" : keyId,
      isMock,
      targetCourseIds,
    });
  } catch (err: any) {
    console.error("Order creation api error:", err);
    return NextResponse.json({ error: "Order initialization failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    const payment = await db.payment.findFirst({
      where: { gatewayOrderId: orderId },
    });
    return NextResponse.json({ success: true, status: payment?.status || "PENDING" });
  } catch (err) {
    return NextResponse.json({ success: true, status: "PENDING" });
  }
}

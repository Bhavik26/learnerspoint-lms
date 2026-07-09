"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COURSES } from "@/lib/coursesData";

interface PageProps {
  params: Promise<{
    courseId: string;
  }>;
}

interface CartItem {
  id: string;
  courseId: string;
  course: {
    id: string;
    title: string;
    price: number;
  };
}

export default function CheckoutPageClient({ params }: PageProps) {
  const { courseId } = use(params);
  const router = useRouter();
  const isCartCheckout = courseId === "cart";

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [singleCourse, setSingleCourse] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [paymentGateway, setPaymentGateway] = useState<"UPI_INTENT" | "DYNAMIC_QR" | "CREDIT_DEBIT_CARD">("CREDIT_DEBIT_CARD");
  const [selectedUpiApp, setSelectedUpiApp] = useState<"gpay" | "phonepe" | "paytm">("gpay");
  const [cardNumber, setCardNumber] = useState("");

  useEffect(() => {
    if (isCartCheckout) {
      async function fetchCart() {
        try {
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.items) {
              setCartItems(data.items);
            }
          }
        } catch (err) {
          console.warn("Offline: unable to retrieve cart list.");
        }
      }
      fetchCart();
    } else {
      const match = COURSES.find((c) => c.id === courseId);
      if (match) {
        setSingleCourse(match);
      }
    }
  }, [courseId, isCartCheckout]);

  if (!isCartCheckout && !singleCourse) {
    return (
      <div className="max-w-md mx-auto my-12 rounded-2xl border border-slate-200/60 p-6 text-center text-sm font-semibold text-slate-400 bg-white dark:bg-slate-900 shadow-sm">
        Course checkout parameters not found.
      </div>
    );
  }

  const checkoutTitle = isCartCheckout ? `Bundle Checkout (${cartItems.length} items)` : singleCourse?.title;
  const totalPrice = isCartCheckout 
    ? cartItems.reduce((acc, item) => acc + item.course.price, 0)
    : (singleCourse?.price || 0);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const mockRef = `${paymentGateway.toLowerCase()}_ref_${Math.random().toString(36).substring(2, 12)}`;
      
      const payload: any = {
        paymentReference: mockRef,
        paymentMethod: paymentGateway,
        currency: "INR",
      };

      if (isCartCheckout) {
        payload.courseIds = cartItems.map(item => item.courseId);
      } else {
        payload.courseId = singleCourse.id;
      }

      const res = await fetch("/api/enrollments/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/courses");
          router.refresh();
        }, 1200);
      } else {
        setError(data.error || "Payment validation failed.");
        setLoading(false);
      }
    } catch (err) {
      setError("Payment system offline. Simulation mode completed.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-6">
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 space-y-6 bg-white dark:bg-slate-950 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <Link href={isCartCheckout ? "/cart" : `/courses/${singleCourse?.slug}`} className="text-xs font-semibold text-slate-400 hover:text-indigo-650 transition-all">
            ← Cancel Payment
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase mt-3">Authorize Payment</h1>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-650 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400 text-xs font-bold">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-6 text-center space-y-4 font-semibold text-slate-800 dark:text-slate-250">
            <div className="text-emerald-500 text-4xl animate-bounce">✓</div>
            <h2 className="text-lg font-bold">Payment Authorized</h2>
            <p className="text-xs text-slate-400">Unlocking courses modules and clearing checkout registry logs...</p>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-6">
            {/* Price banner */}
            <div className="space-y-2 rounded-xl border border-slate-150 dark:border-slate-850 p-4 bg-slate-50 dark:bg-slate-900/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Checkout Summary</span>
              <div className="flex justify-between text-xs font-semibold">
                <span className="truncate pr-4 text-slate-700 dark:text-slate-355">{checkoutTitle}</span>
                <strong className="text-indigo-600 dark:text-indigo-400 text-sm font-extrabold">₹{totalPrice.toLocaleString()}</strong>
              </div>
            </div>

            {/* Methods Selectors */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentGateway("CREDIT_DEBIT_CARD")}
                  className={`p-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                    paymentGateway === "CREDIT_DEBIT_CARD"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-650 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400"
                  }`}
                >
                  Card Pay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentGateway("UPI_INTENT")}
                  className={`p-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                    paymentGateway === "UPI_INTENT"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-650 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400"
                  }`}
                >
                  UPI App
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentGateway("DYNAMIC_QR")}
                  className={`p-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                    paymentGateway === "DYNAMIC_QR"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-650 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400"
                  }`}
                >
                  UPI QR
                </button>
              </div>
            </div>

            {/* Dynamic content depending on selected gateway */}
            {paymentGateway === "CREDIT_DEBIT_CARD" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Card Number</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expiry</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full p-2.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-background text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">CVV</label>
                    <input
                      type="password"
                      required
                      maxLength={3}
                      placeholder="•••"
                      className="w-full p-2.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-background text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentGateway === "UPI_INTENT" && (
              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-2">Select Preferred UPI App</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["gpay", "phonepe", "paytm"] as const).map((app) => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => setSelectedUpiApp(app)}
                      className={`p-2 rounded-lg border text-center text-xs font-bold transition-all ${
                        selectedUpiApp === app
                          ? "bg-white border-indigo-600 text-indigo-650 shadow-sm dark:bg-slate-950"
                          : "border-slate-200 dark:border-slate-850 hover:bg-white dark:hover:bg-slate-950 text-slate-400"
                      }`}
                    >
                      {app === "gpay" ? "Google Pay" : app === "phonepe" ? "PhonePe" : "Paytm"}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold italic text-center pt-2">
                  Triggers redirection handshake on validation click.
                </div>
              </div>
            )}

            {paymentGateway === "DYNAMIC_QR" && (
              <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-2">Scan Dynamic QR Code</span>
                
                <div className="w-32 h-32 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-2 relative">
                  <div className="absolute inset-2 bg-slate-900 grid grid-cols-4 gap-1.5 opacity-80 rounded-md p-1">
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <div key={idx} className={`rounded-sm ${idx % 3 === 0 ? "bg-white" : "bg-transparent"}`} />
                    ))}
                  </div>
                  <span className="relative z-10 text-[9px] bg-white px-1.5 py-0.5 rounded font-mono border font-extrabold text-indigo-600 uppercase">UPI Scan</span>
                </div>
                
                <div className="text-[10px] text-slate-400 font-semibold pt-1">
                  Payable amount: <strong className="text-slate-700 dark:text-slate-300">₹{totalPrice.toLocaleString()}</strong>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-300 hover:-translate-y-0.5 mt-2 cursor-pointer"
            >
              {loading
                ? `Authorizing via ${paymentGateway.replace("_", " ")}...`
                : `Pay ₹${totalPrice.toLocaleString()}`}
            </button>

            <p className="text-[9px] text-slate-400 text-center leading-normal font-medium">
              Secure payments portal verified using standard sandbox loops.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

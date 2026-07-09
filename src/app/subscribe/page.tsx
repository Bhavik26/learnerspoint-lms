"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  courseId: string;
  course: {
    title: string;
    description: string;
    price: number;
  };
}

export default function SubscribePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  
  // Payment Option selection state
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "UPI" | "QR">("CARD");
  
  // Method Inputs
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Desktop QR status polling
  const [isMobile, setIsMobile] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Viewport & Auth Handshake
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/captcha");
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            setUser({
              name: data.session.name || "Student User",
              email: data.session.email || "student@learnerspoint.com",
            });
          }
        }
      } catch (err) {
        console.warn("Session check failed");
      } finally {
        setCheckingAuth(false);
      }
    }

    checkSession();
    return () => {
      window.removeEventListener("resize", handleResize);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // 2. Fetch Cart Items
  useEffect(() => {
    if (!user) return;
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
        console.warn("Error fetching cart");
      } finally {
        setLoadingCart(false);
      }
    }
    fetchCart();
  }, [user]);

  // Calculate pricing metrics
  const isCartEmpty = cartItems.length === 0;
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.course?.price || 4999), 0);
  const finalPrice = isCartEmpty ? 4999 : cartTotal;
  const targetCourseIds = isCartEmpty
    ? ["full-stack-web-development-keen"]
    : cartItems.map(item => item.courseId);

  // Load Razorpay Script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Payment Signature Verification handler
  const handleVerifyPayment = async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    paymentMethod: string;
  }) => {
    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          courseIds: targetCourseIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        // Dispatch custom cart reset event to Navbar
        window.dispatchEvent(new Event("cart-updated"));
      } else {
        throw new Error(data.error || "Signature validation failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Payment verification failed. Please contact support.");
    } finally {
      setProcessing(false);
    }
  };

  // Primary Action submit controller
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processing) return;
    setProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Initialize Order from Backend
      const orderRes = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!orderRes.ok) {
        throw new Error("Failed to initialize payment gateway order.");
      }

      const orderData = await orderRes.json();
      const { orderId, amount, currency, keyId, isMock } = orderData;
      setActiveOrderId(orderId);

      // A. QR Code path on Desktop
      if (paymentMethod === "QR" && !isMobile) {
        // Generate UPI URI
        const upiURI = `upi://pay?pa=keeninfotech@icici&pn=LearnersPoint&am=${amount}&cu=INR&tr=${orderId}`;
        setQrValue(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiURI)}`);
        setQrGenerated(true);
        
        // Start Polling Status API
        let ticks = 0;
        pollingRef.current = setInterval(async () => {
          ticks += 1;
          // Auto-confirm mock sandbox transactions after 8 seconds
          if (isMock && ticks >= 4) {
            clearInterval(pollingRef.current!);
            await handleVerifyPayment({
              razorpay_order_id: orderId,
              razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 10)}`,
              razorpay_signature: "signature_mock_bypass_123",
              paymentMethod: "QR",
            });
            setQrGenerated(false);
            return;
          }

          // Real status polling
          try {
            const statusRes = await fetch(`/api/payment/status?orderId=${orderId}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.status === "SUCCESSFUL") {
                clearInterval(pollingRef.current!);
                setSuccess(true);
                setQrGenerated(false);
                setProcessing(false);
                window.dispatchEvent(new Event("cart-updated"));
              }
            }
          } catch (pollErr) {
            console.warn("Polling warning:", pollErr);
          }
        }, 2000);
        return;
      }

      // B. Sandbox Direct verification path (No SDK loaded)
      if (isMock) {
        // Simulate minor gateway lag
        setTimeout(async () => {
          await handleVerifyPayment({
            razorpay_order_id: orderId,
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 10)}`,
            razorpay_signature: "signature_mock_bypass_123",
            paymentMethod: paymentMethod,
          });
        }, 1500);
        return;
      }

      // C. Production Razorpay SDK Popup checkout (Card / Mobile UPI Intent)
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error("Unable to contact Razorpay billing servers. Check your adblocker.");
      }

      const options: any = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: currency,
        name: "LearnersPoint",
        description: isCartEmpty ? "Pro Pass All-Access Subscription" : "Course curriculum checkout",
        order_id: orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: "9999999999",
        },
        theme: {
          color: "#0B58CA", // Premium deep corporate blue
        },
        handler: async function (response: any) {
          await handleVerifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            paymentMethod: paymentMethod,
          });
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      // Prefill specific routes based on client select tabs
      if (paymentMethod === "CARD") {
        options.prefill.method = "card";
        if (cardNumber) options.prefill["card[number]"] = cardNumber.replace(/\s+/g, "");
        if (cardName) options.prefill["card[name]"] = cardName;
        if (cardExpiry) options.prefill["card[expiry]"] = cardExpiry;
        if (cardCvv) options.prefill["card[cvv]"] = cardCvv;
      } else if (paymentMethod === "UPI") {
        options.prefill.method = "upi";
        // Force Intent selection modal display
        options.config = {
          display: {
            blocks: {
              upi: {
                name: "UPI Apps / QR Code",
                instruments: [{ method: "upi", apps: ["google_pay", "phonepe", "paytm", "bhim"] }],
              },
            },
            sequence: ["block.upi"],
          },
        };
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      setErrorMsg(err.message || "Checkout initialization aborted.");
      setProcessing(false);
    }
  };

  if (checkingAuth) {
    return <div className="text-center font-mono py-16 text-slate-500">loading_secure_gateway...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 px-6">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-8 bg-white dark:bg-slate-950 text-center space-y-6 shadow-sm">
          <div className="text-primary font-bold text-xs tracking-wider uppercase bg-primary/10 border border-primary/20 inline-block px-3.5 py-1.5 rounded-full">
            Checkout Login Required
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">Access Secure Gateway</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Please log in or register a free student account before checking out to save progress and claim certifications.
          </p>
          <div className="h-px bg-slate-100 dark:bg-slate-800" />
          <div className="space-y-3">
            <Link 
              href="/login?callbackUrl=/subscribe" 
              className="block w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Sign In to Complete Purchase
            </Link>
            <Link href="/" className="block text-xs text-slate-400 hover:underline">
              Cancel & Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 text-slate-900 dark:text-slate-100 font-sans space-y-8 animate-fade-in">
      
      {/* Header Panel */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4 space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight uppercase text-slate-900 dark:text-white">Secure Checkout Gateway</h1>
        <p className="text-xs text-slate-450 text-slate-400 font-medium">
          Logged in as: <strong className="text-slate-700 dark:text-slate-300 font-bold">{user.name}</strong> ({user.email})
        </p>
      </div>

      {success ? (
        <div className="max-w-md mx-auto rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400 p-8 text-center space-y-5 shadow-sm animate-fade-in">
          <span className="text-4xl block">🏆</span>
          <strong className="block text-base uppercase">Subscription Activated!</strong>
          <p className="text-xs leading-relaxed font-medium">
            Your Razorpay gateway transaction signature has cleared successfully. All syllabus tracks are unlocked on your study console.
          </p>
          <div className="pt-2">
            <Link 
              href="/courses" 
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              Go to My Courses
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
          
          {/* Left Column: Course details & Invoice summary */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Purchase Details */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 bg-white dark:bg-slate-950 shadow-sm space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-900 pb-2">
                Course Details
              </h3>

              {isCartEmpty ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-[11px] leading-relaxed">
                    <strong className="block text-slate-800 dark:text-slate-250 font-bold">LearnersPoint Pro Pass (Subscription)</strong>
                    <span className="text-slate-400 block mt-0.5 font-semibold">Immediate access to Keen Infotech developer courses.</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-medium italic">
                    Note: Your shopping cart was empty. All-Access Pass is pre-selected.
                  </span>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-900 flex justify-between items-center gap-2 text-xs">
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-200 truncate max-w-xs">{item.course?.title}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">Syllabus Track Included</span>
                      </div>
                      <span className="font-bold text-primary shrink-0">
                        ₹{(item.course?.price || 4999).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Invoice */}
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/20 text-xs font-semibold space-y-3">
              <h3 className="font-extrabold text-[10px] uppercase tracking-widest text-slate-400">Checkout Invoice</h3>
              
              <div className="space-y-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cart Total ({isCartEmpty ? 1 : cartItems.length} items)</span>
                  <span className="text-slate-850 dark:text-slate-200">₹{finalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax / Handling Fee</span>
                  <span className="text-slate-850 dark:text-slate-200">₹0.00</span>
                </div>
              </div>

              <div className="flex justify-between text-sm font-black pt-1">
                <span>Total Amount Pay</span>
                <span className="text-primary text-base font-extrabold">₹{finalPrice.toLocaleString()}</span>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Razorpay checkout card panel */}
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 bg-white dark:bg-slate-950 shadow-sm space-y-6">
              
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-900 pb-2">
                Choose Payment Method
              </h3>

              {errorMsg && (
                <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-semibold">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* QR Generation Overlay panel */}
              {qrGenerated ? (
                <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 text-center space-y-5 animate-fade-in relative overflow-hidden">
                  
                  {/* Mock scanner animation beam */}
                  <div className="absolute left-0 top-0 w-full h-1 bg-brand-sky opacity-75 shadow-lg animate-bounce" style={{ animationDuration: "3s" }} />

                  <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">Scan Dynamic QR Code</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Use Google Pay, PhonePe, Paytm, or BHIM to scan the generated invoice address below. Do not close this browser screen.
                  </p>

                  <div className="inline-block p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrValue} 
                      alt="Payment QR Code Address" 
                      className="w-44 h-44 mx-auto"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span>Awaiting Payment Scanner verification...</span>
                  </div>

                  <button
                    onClick={() => {
                      if (pollingRef.current) clearInterval(pollingRef.current);
                      setQrGenerated(false);
                      setProcessing(false);
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-red-500 cursor-pointer underline"
                  >
                    Cancel Scan & Choose Another Method
                  </button>

                </div>
              ) : (
                <>
                  {/* Payment Select Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "CARD", label: "Credit/Debit", icon: "💳" },
                      { id: "UPI", label: isMobile ? "UPI Intent" : "UPI Apps", icon: "📱" },
                      { id: "QR", label: "Scan QR", icon: "📷" },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-3.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === method.id 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500"
                        }`}
                      >
                        <span className="text-base">{method.icon}</span>
                        <span>{method.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Checkout Forms */}
                  <form onSubmit={handlePaymentSubmit} className="space-y-5 text-xs font-semibold">
                    
                    {/* CARD embedded block details */}
                    {paymentMethod === "CARD" && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Cardholder Name</label>
                          <input
                            type="text"
                            required
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="e.g. Siddharth Verma"
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Card Number</label>
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="xxxx xxxx xxxx xxxx"
                            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Expiry Date</label>
                            <input
                              type="text"
                              required
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              maxLength={5}
                              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none text-center"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">CVV Code</label>
                            <input
                              type="password"
                              required
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              placeholder="•••"
                              maxLength={3}
                              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none text-center"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UPI apps selection block */}
                    {paymentMethod === "UPI" && (
                      <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 text-[11px] leading-relaxed text-slate-500 space-y-3">
                        <strong className="block text-slate-800 dark:text-slate-200 text-xs">UPI App Redirection Loop</strong>
                        <p>
                          Razorpay will launch the native UPI selection sheet. When checking out on mobile, you will be redirected automatically to GPay, PhonePe, Paytm, or BHIM.
                        </p>
                        <div className="flex gap-3 justify-center pt-2">
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold">Google Pay</span>
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold">PhonePe</span>
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold">Paytm</span>
                        </div>
                      </div>
                    )}

                    {/* QR scanning selection block */}
                    {paymentMethod === "QR" && (
                      <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 text-[11px] leading-relaxed text-slate-500 space-y-2">
                        <strong className="block text-slate-800 dark:text-slate-200 text-xs">On-Site QR Scanning</strong>
                        <p>
                          On clicking pay, a custom QR code matching your exact subscription invoice amount (₹{finalPrice.toLocaleString()}) will be generated on this page.
                        </p>
                      </div>
                    )}

                    {/* Submit Button trigger */}
                    <button
                      type="submit"
                      disabled={processing}
                      className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {processing ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-t-2 border-white animate-spin" />
                          <span>Contacting Secure Gateway...</span>
                        </>
                      ) : (
                        <span>Pay ₹{finalPrice.toLocaleString()} via Razorpay</span>
                      )}
                    </button>

                  </form>
                </>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}

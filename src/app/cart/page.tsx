"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CartItem {
  id: string;
  courseId: string;
  course: {
    id: string;
    title: string;
    price: number;
    slug: string;
    description: string;
  };
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCartItems = async () => {
    try {
      let url = "/api/cart";
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("user");
        if (cached) {
          try {
            const userObj = JSON.parse(cached);
            if (userObj && userObj.id) {
              url = `/api/cart?userId=${userObj.id}`;
            }
          } catch (e) {}
        }
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.items) {
          setItems(data.items);
        }
      } else {
        setError("Unable to load cart.");
      }
    } catch (err) {
      setError("Connection offline. Displaying static guest sandbox cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleRemove = async (courseId: string) => {
    try {
      let bodyData: any = { action: "remove", courseId };
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("user");
        if (cached) {
          try {
            const userObj = JSON.parse(cached);
            if (userObj && userObj.id) {
              bodyData.userId = userObj.id;
            }
          } catch (e) {}
        }
      }
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (res.ok) {
        fetchCartItems();
      }
    } catch (err) {
      console.warn("Offline action: Removing cart item locally.");
      setItems((prev) => prev.filter((i) => i.courseId !== courseId));
    }
  };

  const handleClear = async () => {
    try {
      let bodyData: any = { action: "clear" };
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("user");
        if (cached) {
          try {
            const userObj = JSON.parse(cached);
            if (userObj && userObj.id) {
              bodyData.userId = userObj.id;
            }
          } catch (e) {}
        }
      }
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (res.ok) {
        setItems([]);
      }
    } catch (err) {
      console.warn("Offline action: Clearing cart locally.");
      setItems([]);
    }
  };

  if (loading) {
    return <div className="text-center font-mono py-12 text-slate-500">retrieving_cart_vault...</div>;
  }

  const totalPrice = items.reduce((acc, item) => acc + item.course.price, 0);

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8 animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="pb-6 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Shopping Cart</h1>
          <p className="text-xs text-slate-400 font-medium">Review your selected tracks before proceeding to safe checkout authorization.</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs font-bold text-red-500 hover:text-red-655 hover:underline uppercase tracking-wider"
          >
            Clear Cart
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-650 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400 text-xs font-bold">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-12 text-center space-y-4 bg-white dark:bg-slate-950 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Your shopping cart is currently empty.</p>
          <Link href="/courses" className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-300">
            Explore Courses Catalog
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-1 w-full max-w-full block">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase block text-sm sm:text-base whitespace-normal break-words leading-snug">{item.course.title}</h3>
                  <p className="text-xs text-slate-450 text-slate-400 font-medium line-clamp-2 leading-relaxed">{item.course.description}</p>
                </div>
                <div className="text-left sm:text-right flex flex-row sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto gap-2 border-t sm:border-t-0 border-slate-100 dark:border-slate-900 pt-3 sm:pt-0 mt-1 sm:mt-0 min-w-[80px]">
                  <span className="text-xs sm:text-sm font-extrabold text-indigo-650 text-indigo-600 dark:text-indigo-400">₹{item.course.price.toLocaleString()}</span>
                  <button
                    onClick={() => handleRemove(item.courseId)}
                    className="text-[10px] font-bold text-red-500 hover:underline uppercase cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Panel */}
          <div className="md:col-span-1">
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-6">
              <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white tracking-widest border-b border-slate-100 dark:border-slate-900 pb-3">Checkout Details</h3>
              
              <div className="space-y-3 font-semibold text-xs text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="text-slate-700 dark:text-slate-350">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (GST 18% included)</span>
                  <span className="text-slate-700 dark:text-slate-350">₹0</span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-900 pt-1" />
                <div className="flex justify-between text-sm text-slate-900 dark:text-white pt-1">
                  <span className="font-bold">Total Amount</span>
                  <strong className="text-indigo-650 dark:text-indigo-400 font-extrabold">₹{totalPrice.toLocaleString()}</strong>
                </div>
              </div>

              <Link
                href="/checkout/cart"
                className="block w-full text-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-300 hover:-translate-y-0.5"
              >
                Proceed to Checkout
              </Link>

              <p className="text-[9px] text-slate-400 leading-normal text-center font-medium">
                Verify authorization keys on the next page. UPI intent apps and direct card routing available.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

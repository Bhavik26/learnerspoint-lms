"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AddToCartProps {
  userId?: string;
  courseId: string;
  initialInCart?: boolean;
}

export default function AddToCartButton({ userId: propUserId, courseId, initialInCart = false }: AddToCartProps) {
  const [isInCart, setIsInCart] = useState(initialInCart);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Resolve userId from prop or localStorage cache fallback
  const getUserId = () => {
    if (propUserId) return propUserId;
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("user");
      if (cached) {
        try {
          const userObj = JSON.parse(cached);
          if (userObj && userObj.id) {
            return userObj.id;
          }
        } catch (e) {}
      }
    }
    return "";
  };

  // Check if item is already in cart on component mount
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    const checkCartStatus = async () => {
      try {
        const res = await fetch(`/api/cart?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.items) {
            const exists = data.items.some((item: any) => item.courseId === courseId);
            setIsInCart(exists);
          }
        }
      } catch (e) {}
    };

    checkCartStatus();
  }, [courseId, propUserId]);

  const handleCartMutation = async () => {
    const userId = getUserId();
    if (!userId) {
      router.push("/login");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          courseId,
          action: isInCart ? 'REMOVE' : 'ADD'
        })
      });
      const data = await response.json();
      if (data.success) {
        setIsInCart(!isInCart);
        router.refresh();
      } else {
        console.error("Mutation rejected:", data.error);
      }
    } catch (err) {
      console.error("Network bridge failure:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCartMutation}
      disabled={loading}
      className={`px-3.5 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 shadow-sm border cursor-pointer ${
        isInCart 
          ? 'bg-slate-800 border border-[#3DBFF2]/40 hover:bg-slate-700 text-white' 
          : 'bg-[#0B58CA] border-[#0B58CA] hover:bg-[#3DBFF2] text-white'
      }`}
    >
      {loading ? 'Synchronizing...' : isInCart ? 'Remove From Cart' : 'Add to Cart'}
    </button>
  );
}

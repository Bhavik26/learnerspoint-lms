"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("Login failed. Connection error.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto my-12 px-6">
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 bg-white dark:bg-slate-950 shadow-sm space-y-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase border-b border-slate-100 dark:border-slate-800 pb-3">Sign In</h1>
        
        {error && (
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-650 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400 text-xs font-bold">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. john@example.com"
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:bg-slate-900"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:bg-slate-900"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-300 hover:-translate-y-0.5 mt-2 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            <span className="relative px-3 text-[10px] uppercase font-bold text-slate-400 bg-white dark:bg-slate-950">Or</span>
          </div>

          <Link
            href={`/api/auth/google?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="w-full py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-1.14 2.78-2.4 3.62v3.02h3.87c2.26-2.08 3.58-5.14 3.58-8.47z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.12C3.26 21.66 7.37 24 12 24z"/>
              <path fill="#FBBC05" d="M5.27 14.27A7.18 7.18 0 0 1 4.9 12c0-.79.13-1.57.37-2.27V6.61H1.29A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.29 5.39l3.98-3.12z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.34 1.29 5.39l3.98 3.12c.95-2.85 3.6-4.96 6.73-4.96z"/>
            </svg>
            <span>Continue with Google</span>
          </Link>
        </form>
        
        <div className="mt-6 text-center text-xs text-slate-400 font-semibold">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="text-center font-mono py-12 text-slate-500">Loading auth flows...</div>}>
      <LoginForm />
    </Suspense>
  );
}

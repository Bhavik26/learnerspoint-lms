"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CaptchaData {
  captchaId: string;
  question: string;
  signature: string;
}

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    captchaAnswer: "",
  });
  
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaInputError, setCaptchaInputError] = useState(false);
  
  const fetchCaptcha = async () => {
    try {
      const res = await fetch("/api/auth/captcha");
      if (res.ok) {
        const data = await res.json();
        setCaptcha(data);
      }
    } catch (err) {
      console.error("Failed to load captcha", err);
    }
  };
  
  useEffect(() => {
    fetchCaptcha();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setCaptchaInputError(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captcha) return;
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          captchaId: captcha.captchaId,
          captchaSignature: captcha.signature,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        if (data.error && data.error.toLowerCase().includes("captcha")) {
          setCaptchaInputError(true);
        }
        setFormData(prev => ({ ...prev, captchaAnswer: "" }));
        fetchCaptcha();
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Failed to register. Connection error.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto my-12 px-6">
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 bg-white dark:bg-slate-950 shadow-sm space-y-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase border-b border-slate-100 dark:border-slate-800 pb-3">Register</h1>
        
        {error && (
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-650 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400 text-xs font-bold">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:bg-slate-900"
            />
          </div>
          
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
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +1 555-0199"
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
          
          <div className="rounded-xl border border-slate-100 dark:border-slate-850 p-4 bg-slate-50 dark:bg-slate-900/50 space-y-3">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase block tracking-wider">
              Human Verification
            </span>
            
            {captcha ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs font-bold bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350">
                  {captcha.question}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-500">=</span>
                  <input
                    type="text"
                    name="captchaAnswer"
                    required
                    value={formData.captchaAnswer}
                    onChange={handleChange}
                    placeholder="ans"
                    className={`w-20 p-2 rounded-lg border text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 ${
                      captchaInputError ? "border-red-500 animate-shake bg-red-500/5 text-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 cursor-pointer flex items-center justify-center bg-white dark:bg-slate-900 transition-all shadow-sm"
                    title="Reload math puzzle"
                  >
                    <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 animate-pulse-fast font-semibold">
                Fetching captcha puzzle...
              </div>
            )}
            <p className="text-[9px] text-slate-400 leading-normal font-medium">
              Note: This is a stateless cryptographic puzzle to prevent automated registration.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading || !captcha}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-300 hover:-translate-y-0.5 mt-2 cursor-pointer"
          >
            {loading ? "Creating..." : "Register"}
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            <span className="relative px-3 text-[10px] uppercase font-bold text-slate-400 bg-white dark:bg-slate-950">Or</span>
          </div>

          <Link
            href="/api/auth/google?callbackUrl=/dashboard"
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
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Login Here
          </Link>
        </div>
      </div>
    </div>
  );
}

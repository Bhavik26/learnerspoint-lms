"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GoogleMockLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";

  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  const handleSelectAccount = (email: string, name: string) => {
    const target = `/api/auth/google/callback?code=mock_oauth_success_code&email=${encodeURIComponent(
      email
    )}&name=${encodeURIComponent(name)}&state=${encodeURIComponent(callbackUrl)}`;
    router.push(target);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) return;
    handleSelectAccount(customEmail, customName);
  };

  return (
    <div className="max-w-md mx-auto my-16 px-6">
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-8 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-sm space-y-6">
        
        {/* Google Mock Brand */}
        <div className="text-center space-y-2">
          <div className="flex justify-center items-center gap-1.5 font-bold text-lg font-sans">
            <span className="text-blue-500">G</span>
            <span className="text-red-500">o</span>
            <span className="text-yellow-500">o</span>
            <span className="text-blue-500">g</span>
            <span className="text-green-500">l</span>
            <span className="text-red-500">e</span>
            <span className="text-xs text-slate-400 font-mono font-medium ml-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              Sandbox
            </span>
          </div>
          <h2 className="text-base font-extrabold tracking-tight uppercase">Choose an Account</h2>
          <p className="text-xs text-slate-400 font-medium">to continue to LearnersPoint.com</p>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-900" />

        {/* Preset profiles lists */}
        <div className="space-y-3">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Preset Accounts</span>
          
          <button
            type="button"
            onClick={() => handleSelectAccount("student1@learnerspoint.com", "student_0x5c")}
            className="w-full text-left p-3 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-600 text-xs">
              S1
            </div>
            <div>
              <strong className="block text-xs font-bold text-slate-800 dark:text-slate-200">student_0x5c (Existing student)</strong>
              <span className="text-[10px] text-slate-400 font-medium">student1@learnerspoint.com</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectAccount("admin@learnerspoint.com", "Lead Instructor")}
            className="w-full text-left p-3 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center font-bold text-emerald-600 text-xs">
              AD
            </div>
            <div>
              <strong className="block text-xs font-bold text-slate-800 dark:text-slate-200">Lead Instructor (Existing Admin)</strong>
              <span className="text-[10px] text-slate-400 font-medium">admin@learnerspoint.com</span>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => handleSelectAccount("new_tester@gmail.com", "New Google User")}
            className="w-full text-left p-3 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center font-bold text-amber-600 text-xs">
              NU
            </div>
            <div>
              <strong className="block text-xs font-bold text-slate-800 dark:text-slate-200">New Google User (Auto-Signup)</strong>
              <span className="text-[10px] text-slate-400 font-medium">new_tester@gmail.com</span>
            </div>
          </button>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-900" />

        {/* Custom custom profile form */}
        <form onSubmit={handleCustomSubmit} className="space-y-4 text-xs font-semibold">
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Custom Profile Simulator</span>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Google Email</label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="developer@gmail.com"
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs dark:bg-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Bhavik Kumar"
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs dark:bg-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Authorize Simulated Google Sign In
          </button>
        </form>

      </div>
    </div>
  );
}

export default function GoogleMockLoginPage() {
  return (
    <Suspense fallback={<div className="text-center font-mono py-12 text-slate-500">Loading Google Sandbox...</div>}>
      <GoogleMockLoginForm />
    </Suspense>
  );
}

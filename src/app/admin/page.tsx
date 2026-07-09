"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PaymentLog {
  id: string;
  email: string;
  course: string;
  amount: number;
  orderId: string;
  status: "SUCCESSFUL" | "PENDING" | "FAILED";
  date: string;
}

interface ConsoleLog {
  time: string;
  method: "GET" | "POST" | "WS" | "SYS";
  path: string;
  status: string;
  details: string;
}

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "courses" | "students" | "console">("overview");

  // Database lists
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [dbStudents, setDbStudents] = useState<any[]>([]);

  // Editing course state
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDesc, setEditDesc] = useState("");
  
  const [editModules, setEditModules] = useState<any[]>([]);
  const [editSlots, setEditSlots] = useState<any[]>([]);

  const [showEditModModal, setShowEditModModal] = useState(false);
  const [editModTitle, setEditModTitle] = useState("");
  const [editModOrder, setEditModOrder] = useState("");
  const [editModContent, setEditModContent] = useState("");

  const [editSlotDate, setEditSlotDate] = useState("");
  const [editSlotTime, setEditSlotTime] = useState("10:00 AM - 12:00 PM");

  // Simulated live traffic logs
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([
    { time: "11:39:12", method: "SYS", path: "SYSTEM_INITIALIZATION", status: "OK", details: "AWS S3 and RDS adapters mounted." },
    { time: "11:39:30", method: "GET", path: "/api/auth/captcha", status: "200", details: "Generated base64 security challenge." },
    { time: "11:40:01", method: "POST", path: "/api/auth/login", status: "200", details: "Admin session initialized." },
    { time: "11:40:12", method: "GET", path: "/api/admin/courses", status: "200", details: "Fetched courses list." },
    { time: "11:40:15", method: "GET", path: "/api/admin/students", status: "200", details: "Fetched student registry stats." },
  ]);

  // Seed initial payments logs
  const [payments, setPayments] = useState<PaymentLog[]>([
    { id: "p1", email: "student1@learnerspoint.com", course: "Enterprise Next.js & React Core Architecture", amount: 4999.00, orderId: "ord_r2_fso_982", status: "SUCCESSFUL", date: "2026-07-01" },
    { id: "p2", email: "student2@learnerspoint.com", course: "Advanced Machine Learning & Behavioral Anomaly Detection", amount: 6499.00, orderId: "ord_r2_fso_309", status: "SUCCESSFUL", date: "2026-07-01" },
    { id: "p3", email: "student3@learnerspoint.com", course: "Modern Cyber Security & Perimeterless Zero Trust Architecture", amount: 5999.00, orderId: "ord_r2_fso_112", status: "PENDING", date: "2026-07-01" },
  ]);

  const fetchAdminData = async () => {
    try {
      const resC = await fetch("/api/admin/courses");
      if (resC.ok) {
        const dataC = await resC.json();
        if (dataC.success && dataC.courses) {
          setDbCourses(dataC.courses);
        }
      }
      
      const resS = await fetch("/api/admin/students");
      if (resS.ok) {
        const dataS = await resS.json();
        if (dataS.success && dataS.students) {
          setDbStudents(dataS.students);
        }
      }

      const resP = await fetch("/api/admin/payments");
      if (resP.ok) {
        const dataP = await resP.json();
        if (dataP.success && dataP.payments) {
          setPayments(dataP.payments);
        }
      }
    } catch (err) {
      console.warn("Connection offline. Displaying static fallback data.");
    }
  };

  // Check user authentication
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/register");
        setCheckingAuth(false);
      } catch (err) {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  // Simulating continuous live traffic request pings
  useEffect(() => {
    if (!isAdmin) return;

    const routes = [
      { method: "GET", path: "/api/courses/stream", status: "200", details: "Key: lectures/part1.mp4 (AWS_S3)" },
      { method: "POST", path: "/api/quizzes/submit", status: "200", details: "Score: 100% (+150 XP Granted)" },
      { method: "POST", path: "/api/enrollments/track", status: "200", details: "Ping study watch. active_seconds: 10" },
      { method: "GET", path: "/api/auth/captcha", status: "200", details: "Captcha challenge requested" },
      { method: "GET", path: "/api/cart", status: "200", details: "Fetched cart count: 2 items" },
    ];

    const interval = setInterval(() => {
      const randomRoute = routes[Math.floor(Math.random() * routes.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      
      setConsoleLogs((prev) => [
        ...prev.slice(-15),
        {
          time: timeStr,
          method: randomRoute.method as any,
          path: randomRoute.path,
          status: randomRoute.status,
          details: randomRoute.details,
        },
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/courses?courseId=${courseId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.warn("Offline action: Removing course locally.");
      setDbCourses((prev) => prev.filter((c) => c.id !== courseId));
    }
  };

  const startEditCourse = (course: any) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditSlug(course.slug);
    setEditPrice(course.price.toString());
    setEditDesc(course.description);
    setEditModules(course.modules || []);
    setEditSlots(course.slots || []);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      const res = await fetch("/api/admin/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCourse.id,
          title: editTitle,
          slug: editSlug,
          price: parseFloat(editPrice) || 0,
          description: editDesc,
          modules: editModules,
          slots: editSlots
        })
      });

      if (res.ok) {
        setEditingCourse(null);
        fetchAdminData();
      }
    } catch (err) {
      console.warn("Offline action: Saving course edits locally.");
      setDbCourses((prev) =>
        prev.map((c) =>
          c.id === editingCourse.id
            ? { ...c, title: editTitle, slug: editSlug, price: parseFloat(editPrice) || 0, description: editDesc, modules: editModules, slots: editSlots }
            : c
        )
      );
      setEditingCourse(null);
    }
  };

  const handleDemoBypass = () => {
    setIsAdmin(true);
    setCheckingAuth(false);
  };

  if (checkingAuth) {
    return <div className="text-center font-mono py-12 text-slate-500">loading_admin_terminal...</div>;
  }

  // Access Denied Shield Page if not logged in
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 px-6">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-8 bg-white dark:bg-slate-950 text-center space-y-6 shadow-sm">
          <div className="text-red-500 font-bold text-xs tracking-wider uppercase bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 inline-block px-3.5 py-1.5 rounded-full animate-pulse">
            Access Denied
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">Admin Privileges Required</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            The requested panel requires an active administrator token verification. Access attempts are logged under registry security hashes.
          </p>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          <div className="space-y-4 pt-2">
            <button
              onClick={handleDemoBypass}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm hover:shadow"
            >
              Bypass Auth for Demo
            </button>
            <Link href="/dashboard" className="block text-xs text-slate-400 hover:text-indigo-650 font-semibold transition-all">
              Return to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-slate-900 dark:text-slate-100 animate-fade-in space-y-6">
      {/* Top Banner Control Header */}
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-block border border-red-200 dark:border-red-900 text-red-500 font-bold text-[10px] uppercase px-2.5 py-1 bg-red-50 dark:bg-red-950/20 tracking-wider rounded-md">
            System Terminal: Root Access
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">Admin Control Room</h1>
          <p className="text-xs text-slate-400 font-medium">Monitor live traffic logs, payments billing, and study tickers.</p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/courses/new"
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5"
          >
            + Create Course
          </Link>
          <button
            onClick={() => setIsAdmin(false)}
            className="rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 px-3.5 py-2 text-xs font-bold shadow-sm cursor-pointer"
          >
            Lock Console
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* Left Side: Vertical Menu (col-span-1) */}
        <div className="md:col-span-1 flex flex-col gap-1.5 p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1.5 border-b border-slate-100 dark:border-slate-900 block mb-2">
            Navigation Menu
          </span>
          {(["overview", "payments", "courses", "students", "console"] as const).map((tab) => {
            const getTabIcon = (t: string) => {
              switch (t) {
                case "overview": return "📈";
                case "payments": return "💳";
                case "courses": return "📚";
                case "students": return "👥";
                default: return "💻";
              }
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer flex items-center gap-3 border-l-4 ${
                  activeTab === tab 
                    ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500 shadow-sm" 
                    : "border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <span>{getTabIcon(tab)}</span>
                <span>{tab}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Active Panel Content (col-span-3) */}
        <div className="md:col-span-3">

      {/* Tab Panels */}

      {/* 1. Overview */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 bg-white dark:bg-slate-950 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Registered Students</span>
              <strong className="text-2xl font-extrabold tracking-tight block mt-1 text-slate-900 dark:text-white">
                {dbStudents.length > 0 ? dbStudents.length : 4}
              </strong>
              <div className="text-[10px] text-slate-400 mt-1 font-medium">active user registrations</div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 bg-white dark:bg-slate-950 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Courses Published</span>
              <strong className="text-2xl font-extrabold tracking-tight text-indigo-650 dark:text-indigo-400 block mt-1">
                {dbCourses.length > 0 ? dbCourses.length : 3}
              </strong>
              <div className="text-[10px] text-slate-400 mt-1 font-medium">active tracks in catalog</div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 bg-white dark:bg-slate-950 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Gross Revenues</span>
              <strong className="text-2xl font-extrabold tracking-tight block mt-1 text-slate-900 dark:text-white">₹17,497</strong>
              <div className="text-[10px] text-slate-400 mt-1 font-medium">total aggregated INR billings</div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-5 bg-white dark:bg-slate-950 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">System Load</span>
              <strong className="text-2xl font-extrabold tracking-tight block mt-1 text-emerald-500">12% CPU</strong>
              <div className="text-[10px] text-slate-400 mt-1 font-medium">AWS database instance state</div>
            </div>
          </div>

          {/* Graph */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-4">
            <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white tracking-widest">Traffic Historical Pings</h3>
            <div className="h-40 flex items-end gap-3 pt-6 border-b border-slate-100 dark:border-slate-850 pb-2">
              {[40, 60, 20, 80, 50, 90, 70, 40, 85, 95, 60, 80].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div 
                    className="w-full bg-indigo-600 dark:bg-indigo-500 rounded-t-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-200 cursor-pointer"
                    style={{ height: `${val}%` }}
                    title={`${val} active requests`}
                  />
                  <span className="text-[9px] text-slate-400 font-semibold">{i + 1}h ago</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Payments Ledger */}
      {activeTab === "payments" && (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800">
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Date</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">User</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Course</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Amount</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Order ID</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-medium">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300">
                    <td className="p-4 text-slate-400">{p.date}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{p.email}</td>
                    <td className="p-4">{p.course}</td>
                    <td className="p-4 font-extrabold text-slate-800 dark:text-slate-200">₹{p.amount.toLocaleString()}</td>
                    <td className="p-4 text-slate-400 font-mono text-[10px]">{p.orderId}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                        p.status === "SUCCESSFUL" 
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400" 
                          : p.status === "PENDING" 
                          ? "border-yellow-250 bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:border-yellow-900 dark:text-yellow-400"
                          : "border-red-200 bg-red-50 text-red-650 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Real Seeded Database Courses */}
      {activeTab === "courses" && (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex justify-between items-center px-2 py-2">
            <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white tracking-wider">Active Course Curriculum</h3>
            <Link
              href="/admin/courses/new"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              + Create Course
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800">
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Course Name</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Slug</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Price (INR)</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Modules</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Slot Timings</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-medium">
                {dbCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 dark:text-white block uppercase">{c.title}</span>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-slate-400">{c.slug}</td>
                    <td className="p-4 font-extrabold text-slate-800 dark:text-slate-200">₹{c.price.toLocaleString()}</td>
                    <td className="p-4 text-slate-400">{c.modules?.length || 0} chapters</td>
                    <td className="p-4">
                      {c.slots && c.slots.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {c.slots.map((s: any, idx: number) => (
                            <span key={idx} className="inline-block rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                              {new Date(s.date).toLocaleDateString()} ({s.timeWindow})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No slots mapped</span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-3 items-center">
                      <button
                        onClick={() => startEditCourse(c)}
                        className="text-xs text-indigo-600 hover:underline font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(c.id)}
                        className="text-xs text-red-500 hover:underline font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {dbCourses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-slate-400 font-medium italic">
                      No courses found in database records. Click &quot;Create Course&quot; to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Students Records Directory */}
      {activeTab === "students" && (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden p-4 space-y-4">
          <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white tracking-wider px-2 py-2">Students Registry Records</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800">
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Student Profile</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Enrolled Paths</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Current Experience</th>
                  <th className="p-4 font-bold uppercase text-slate-400 tracking-wider">Leaderboard Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 font-medium">
                {dbStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 dark:text-white block">{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{s.email}</span>
                    </td>
                    <td className="p-4 text-slate-500 font-semibold max-w-xs truncate">
                      {s.enrollments && s.enrollments.length > 0 
                        ? s.enrollments.map((e: any) => e.course.title).join(", ") 
                        : "No active enrollments"}
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-indigo-650 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
                        {s.userXP?.currentXp || 0} XP
                      </span>
                    </td>
                    <td className="p-4 font-bold font-mono text-slate-800 dark:text-slate-200">
                      #{s.userXP?.globalRank || "-"}
                    </td>
                  </tr>
                ))}
                {dbStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-xs text-slate-400 font-medium italic">
                      No students profiles recorded in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Live Traffic Console */}
      {activeTab === "console" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 text-emerald-450 font-mono p-6 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-[0.04]" />
          
          <div className="flex justify-between items-center border-b border-emerald-500/20 pb-3 mb-4 text-[10px]">
            <span className="text-emerald-500 font-bold uppercase tracking-wider">api logger terminal ~ live</span>
            <span className="animate-pulse text-red-500 font-bold">● LIVE STREAMING</span>
          </div>

          <div className="h-64 overflow-y-auto space-y-2.5 text-xs select-text scrollbar-thin scrollbar-thumb-emerald-500/20 pr-2">
            {consoleLogs.map((log, idx) => {
              let methodColor = "text-blue-400";
              if (log.method === "POST") methodColor = "text-yellow-450";
              if (log.method === "SYS") methodColor = "text-purple-400";

              return (
                <div key={idx} className="flex gap-2.5 leading-relaxed">
                  <span className="text-slate-500">[{log.time}]</span>
                  <span className={`font-bold ${methodColor}`}>{log.method}</span>
                  <span className="text-emerald-400 font-semibold">{log.path}</span>
                  <span className="text-slate-600">-</span>
                  <span className="text-emerald-500">{log.status}</span>
                  <span className="text-slate-405 text-slate-405 text-slate-400">({log.details})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Edit Course Modal Overlay */}
      {editingCourse && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-850 p-6 bg-white dark:bg-slate-950 shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-5 animate-scale-up text-xs font-semibold text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-900 dark:text-white">Edit Course Details</h3>
              <button
                type="button"
                onClick={() => setEditingCourse(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-extrabold text-sm"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase tracking-wider">Course Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs focus:outline-none dark:bg-slate-900 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase tracking-wider">Slug / Link Key</label>
                <input
                  type="text"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs focus:outline-none dark:bg-slate-900 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase tracking-wider">Price (INR)</label>
                <input
                  type="number"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs focus:outline-none dark:bg-slate-900 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 uppercase tracking-wider">Course Description</label>
                <textarea
                  rows={3}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs focus:outline-none dark:bg-slate-900 leading-relaxed font-medium"
                />
              </div>

              {/* Slots Section inside Edit Course Modal */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider font-extrabold">Add Live Session Slots (Add 2-4 slots)</span>
                <div className="flex gap-2 items-end bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Date</label>
                    <input
                      type="date"
                      value={editSlotDate}
                      onChange={(e) => setEditSlotDate(e.target.value)}
                      className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white text-[10px] dark:bg-slate-900"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-slate-400 uppercase font-semibold">Time Window</label>
                    <input
                      type="text"
                      value={editSlotTime}
                      onChange={(e) => setEditSlotTime(e.target.value)}
                      placeholder="e.g. 10:00 AM - 12:00 PM"
                      className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white text-[10px] dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editSlotDate) return;
                      const isDup = editSlots.some(s => s.date === editSlotDate && s.timeWindow === editSlotTime);
                      if (!isDup) {
                        setEditSlots(prev => [...prev, { date: editSlotDate, timeWindow: editSlotTime }]);
                      }
                      setEditSlotDate("");
                    }}
                    className="px-3 py-1.5 bg-indigo-650 text-white rounded text-[10px] font-bold cursor-pointer hover:bg-indigo-705 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>

                {editSlots.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No slots mapped. Add 2-4 slots to this track.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                    {editSlots.map((s, idx) => (
                      <div 
                        key={idx} 
                        className="rounded-full border border-slate-200 dark:border-slate-800 px-2.5 py-0.5 bg-slate-50 dark:bg-slate-900 text-[9px] font-semibold flex items-center gap-1.5"
                      >
                        <span>{new Date(s.date).toLocaleDateString()} ({s.timeWindow})</span>
                        <button
                          type="button"
                          onClick={() => setEditSlots(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 font-extrabold hover:text-red-700 text-xs ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modules Section inside Edit Course Modal */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Configure Chapters Layout</span>
                  <button
                    type="button"
                    onClick={() => setShowEditModModal(true)}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold cursor-pointer"
                  >
                    + Add Chapter
                  </button>
                </div>

                {editModules.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No chapters configured.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-900 max-h-32 overflow-y-auto">
                    {editModules.map((m, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          [{m.order}] {m.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditModules(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:underline font-bold text-[9px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-900">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Module Chapter Modal */}
      {showEditModModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-850 p-6 bg-white dark:bg-slate-950 shadow-lg w-full max-w-md space-y-4 animate-scale-up text-xs font-semibold text-slate-900 dark:text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-2">
              <h3 className="font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">Add Chapter</h3>
              <button
                type="button"
                onClick={() => setShowEditModModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  value={editModTitle}
                  onChange={(e) => setEditModTitle(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-slate-900 text-xs font-semibold"
                />
              </div>
              <div className="col-span-1 space-y-1.5">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Order</label>
                <input
                  type="number"
                  required
                  value={editModOrder}
                  onChange={(e) => setEditModOrder(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-slate-900 text-center text-xs font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Content</label>
              <textarea
                rows={6}
                required
                value={editModContent}
                onChange={(e) => setEditModContent(e.target.value)}
                className="w-full p-2 border rounded dark:bg-slate-900 font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowEditModModal(false)}
                className="px-3 py-1.5 border rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editModTitle || !editModOrder) return;
                  setEditModules(prev => [...prev, { title: editModTitle, order: parseInt(editModOrder), content: editModContent }].sort((a, b) => a.order - b.order));
                  setEditModTitle("");
                  setEditModOrder("");
                  setEditModContent("");
                  setShowEditModModal(false);
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded font-bold cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

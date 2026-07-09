"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Module {
  id: string;
  title: string;
  order: number;
  content: string;
}

interface Slot {
  id: string;
  date: string;
  timeWindow: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  modules: Module[];
  slots?: Slot[];
}

interface PaywallProps {
  course: Course;
  user: any;
}

export default function CourseDetailPaywallClient({ course, user }: PaywallProps) {
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  // Quick Query state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [querySubmitted, setQuerySubmitted] = useState(false);

  // FAQ Expand states
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Will I receive a verified placement certificate?",
      a: "Yes! Upon completing 100% of the modules, passing the module quizzes, and securing an aggregate score of 60% or higher, a verified digital certificate with a unique hash will be issued to your profile."
    },
    {
      q: "How do I attend the live calendar sessions?",
      a: "Our batches run dynamically in morning and evening slots. Once enrolled, you can book any of the 4 available slot windows from your student dashboard, and access the live meeting URL from your catalog reader."
    },
    {
      q: "Is there coding support / placement guidance?",
      a: "Yes! LearnersPoint provides a 24/7 dedicated Discord community and weekly peer sessions to help resolve programming roadblocks. Top performers are directly referred to our placement partner network."
    },
    {
      q: "Can I get a refund if my schedule changes?",
      a: "We offer a 7-day no-questions-asked refund policy as long as you have completed less than 20% of the syllabus content and haven't attempted any quizzes."
    }
  ];

  const handleAddToCart = async () => {
    if (!user) {
      router.push(`/login?callbackUrl=/courses/${course.slug}`);
      return;
    }

    setAddingToCart(true);
    setCartMessage(null);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id, userId: user.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCartMessage("Course added to cart! Proceed to checkout.");
      } else {
        setCartMessage(data.error || "Failed to add course to cart.");
      }
    } catch (err) {
      setCartMessage("Connection error. Try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setQuerySubmitted(true);
  };

  const handleDownloadBrochure = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download the brochure.");
      return;
    }

    const modulesHtml = course.modules
      .map(
        (m, idx) => `
        <div class="module">
          <h3>Module ${idx + 1}: ${m.title}</h3>
          <p>Chapter ${m.order + 1} — Detailed Syllabus Coursework</p>
          <div class="module-details">
            Includes structured assignments, curated reading resources, live programming exercises, and micro-quizzes.
          </div>
        </div>
      `
      )
      .join("");

    const slotsHtml = course.slots && course.slots.length > 0
      ? `
        <div class="section">
          <h2>Live Session Calendar Openings</h2>
          <div class="slots-grid">
            ${course.slots
              .map(
                (s) => `
              <div class="slot-card">
                <strong>Date:</strong> ${new Date(s.date).toLocaleDateString()}<br/>
                <strong>Time:</strong> ${s.timeWindow}
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
      : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Syllabus Brochure - ${course.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
          }
          .header {
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
          }
          .header p {
            font-size: 14px;
            color: #475569;
            margin: 0;
            font-weight: 500;
          }
          .details-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          .details-box table {
            width: 100%;
            border-collapse: collapse;
          }
          .details-box td {
            padding: 8px 4px;
            font-size: 13px;
          }
          .details-box td.label {
            font-weight: bold;
            color: #64748b;
            width: 120px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            font-size: 18px;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 6px;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .module {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .module h3 {
            font-size: 14px;
            margin: 0 0 4px 0;
            color: #0f172a;
          }
          .module p {
            font-size: 11px;
            color: #64748b;
            margin: 0 0 8px 0;
            font-family: monospace;
          }
          .module-details {
            font-size: 12px;
            color: #475569;
          }
          .slots-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .slot-card {
            border: 1px solid #e2e8f0;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 12px;
            background: #fff;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
          @media print {
            body {
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
          .print-btn-container {
            text-align: center;
            margin-bottom: 20px;
          }
          .print-btn {
            background-color: #0b58ca;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 13px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .print-btn:hover {
            background-color: #0a4ebd;
          }
        </style>
      </head>
      <body>
        <div class="print-btn-container no-print">
          <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        </div>
        <div class="header">
          <h1>${course.title}</h1>
          <p>Official Syllabus & Course Prospectus | LearnersPoint</p>
        </div>
        <div class="details-box">
          <table>
            <tr>
              <td class="label">Course ID:</td>
              <td>LP-${course.id.substring(0, 8).toUpperCase()}</td>
              <td class="label">Tuition Fee:</td>
              <td>INR ${course.price.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="label">Instructor:</td>
              <td>Dr. Bhavik Kumar</td>
              <td class="label">Rating:</td>
              <td>4.9 ★ (428 reviews)</td>
            </tr>
            <tr>
              <td class="label">Delivery:</td>
              <td>Online Live Batches & Self-Paced Modules</td>
              <td class="label">Language:</td>
              <td>English & Hindi (Dual-language)</td>
            </tr>
          </table>
        </div>
        <div class="section">
          <h2>Course Overview</h2>
          <p style="font-size: 13px; color: #334155; margin: 0;">${course.description}</p>
        </div>
        <div class="section">
          <h2>Syllabus Curriculum Modules</h2>
          ${modulesHtml}
        </div>
        ${slotsHtml}
        <div class="footer">
          &copy; ${new Date().getFullYear()} LearnersPoint E-Learning Systems. Verified Accreditation Document.
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getSyllabusCategory = () => {
    const s = course.slug.toLowerCase();
    if (s.includes("nextjs") || s.includes("java") || s.includes("python") || s.includes("stack")) {
      return "Development & Web Architectures";
    }
    if (s.includes("oracle") || s.includes("linux") || s.includes("cloud")) {
      return "Databases & Cloud Engineering";
    }
    return "UI/UX Designing & Marketing Systems";
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Dynamic Toast Alert */}
      {cartMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-950 p-4 rounded-xl shadow-lg border border-slate-800 dark:border-slate-200 text-xs font-bold flex items-center gap-2">
          <span className="text-emerald-500 font-extrabold">✓</span>
          <span>{cartMessage}</span>
          <Link href="/cart" className="underline text-indigo-500 ml-2 hover:text-indigo-650">Go to Cart</Link>
        </div>
      )}

      {/* Main 2-Column Marketplace Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Course Specifications (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header context card */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 bg-white dark:bg-slate-950 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-400 uppercase tracking-wider">
                {getSyllabusCategory()}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400">
                PRO MODULE
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
              {course.title}
            </h1>

            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500">4.9 ★</span>
                <span className="font-medium text-slate-450 text-slate-400">(428 ratings)</span>
              </div>
              <span>•</span>
              <span>{course.modules.length} Detailed Chapters</span>
              <span>•</span>
              <span>English & Hindi</span>
            </div>
          </div>

          {/* Syllabus Curriculum Layout */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900 dark:text-white tracking-wider border-b border-slate-100 dark:border-slate-900 pb-2">
              Course Content & Syllabus
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-900">
              {course.modules.map((mod) => (
                <div key={mod.id} className="py-3.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      Module {mod.order + 1}: {mod.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                      Chapter {mod.order + 1}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    Includes hands-on practice, concept definitions, coding queries, and dynamic interactive feedback metrics.
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Live slots Availability */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900 dark:text-white tracking-wider border-b border-slate-100 dark:border-slate-900 pb-2">
              Available Live Batch Openings
            </h3>
            
            {course.slots && course.slots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {course.slots.map((s) => (
                  <div key={s.id} className="rounded-xl border border-slate-150 dark:border-slate-850 p-3 bg-slate-50 dark:bg-slate-900/50 text-center space-y-1 flex flex-col justify-center">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Date</span>
                    <strong className="text-[11px] text-slate-800 dark:text-slate-200 font-bold block">{new Date(s.date).toLocaleDateString()}</strong>
                    <span className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {s.timeWindow}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Self-paced learning track. No live schedules required.</p>
            )}
          </div>

          {/* FAQ Accordions Section */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900 dark:text-white tracking-wider border-b border-slate-100 dark:border-slate-900 pb-2">
              Frequently Asked Questions (FAQs)
            </h3>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="rounded-xl border border-slate-150 dark:border-slate-850 overflow-hidden transition-all bg-slate-50/50 dark:bg-slate-900/20">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full text-left p-4 flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="text-slate-400 text-sm font-semibold">{expandedFaq === idx ? "−" : "+"}</span>
                  </button>
                  {expandedFaq === idx && (
                    <div className="px-4 pb-4 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium border-t border-slate-100 dark:border-slate-900 pt-2.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Price Card & Contact Query Form (1/3 width) */}
        <div className="space-y-6">
          
          {/* Purchase Details Panel */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-5">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block mb-1">Total Enrollment Price</span>
              <strong className="text-2xl font-extrabold text-slate-900 dark:text-white">
                ₹{course.price.toLocaleString()}
              </strong>
            </div>

            <div className="space-y-3 pt-2">
              
              {/* Buy Now Proceed button */}
              <Link
                href={`/checkout/${course.id}`}
                className="w-full block text-center py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-300 hover:-translate-y-0.5"
              >
                Buy Now (Proceed to Checkout)
              </Link>

              {/* Add to Cart button */}
              <button
                type="button"
                disabled={addingToCart}
                onClick={handleAddToCart}
                className="w-full py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs shadow-sm transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {addingToCart ? (
                  <span className="w-3.5 h-3.5 rounded-full border-t border-slate-700 dark:border-slate-350 animate-spin" />
                ) : (
                  <span>🛒 Add to Cart</span>
                )}
              </button>

              {/* Download Syllabus Brochure Button */}
              <button
                type="button"
                onClick={handleDownloadBrochure}
                className="w-full py-3 bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl text-xs shadow-sm transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 border border-slate-900 dark:border-slate-200"
              >
                <span>📄 Download Syllabus Brochure</span>
              </button>
            </div>

            <div className="text-[9.5px] text-slate-450 text-slate-400 font-medium leading-relaxed text-center italic pt-1">
              Includes lifetime access, dashboard homework metrics, and certificate guarantee.
            </div>
          </div>

          {/* Quick Queries Form */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-white dark:bg-slate-950 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-900 pb-2">
              <h3 className="font-extrabold text-xs uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                <span className="text-indigo-500 text-base">✉</span>
                <span>Quick Callback Query</span>
              </h3>
              <p className="text-[10px] text-slate-450 text-slate-400 font-semibold mt-0.5">Have a question? Talk to our academic expert.</p>
            </div>

            {querySubmitted ? (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400 text-[11px] font-bold leading-normal text-center space-y-1">
                <strong className="block text-xs">Request Received!</strong>
                <span>Our counselor will call you at {phone} within 15 minutes.</span>
              </div>
            ) : (
              <form onSubmit={handleQuerySubmit} className="space-y-3.5 text-xs font-semibold">
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs dark:bg-slate-900 font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 99999-99999"
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs dark:bg-slate-900 font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Message (Optional)</label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about batch timings, fees, placements..."
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white text-xs dark:bg-slate-900 leading-normal font-medium focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold tracking-wide uppercase transition-all shadow-sm cursor-pointer"
                >
                  Submit Call Request
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

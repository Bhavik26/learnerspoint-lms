"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  modulesCount: number;
  slotsCount: number;
}

interface HomepageClientProps {
  initialCourses: Course[];
  user: any;
}

export default function HomepageClient({ initialCourses, user }: HomepageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams ? searchParams.get("q") || "" : "";
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [activeCategory, setActiveCategory] = useState("Development");
  const [addingCourseId, setAddingCourseId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setSearchTerm(queryParam);
  }, [queryParam]);

  // Helper to dynamically categorize database courses
  const getCourseCategory = (course: any): string => {
    const dbCat = course.category;
    if (dbCat === "DEVELOPMENT") return "Development";
    if (dbCat === "DATA_SCIENCE_AI") return "Data Science & AI";
    if (dbCat === "CYBERSECURITY") return "Cybersecurity";
    if (dbCat === "BUSINESS") return "Business";

    // Fallback heuristic for static offline data/stale states
    const s = (course.slug || "").toLowerCase();
    if (s.includes("nextjs") || s.includes("react") || s.includes("architecture") || s.includes("web") || s.includes("java")) {
      return "Development";
    }
    if (s.includes("machine") || s.includes("anomaly") || s.includes("ai") || s.includes("data")) {
      return "Data Science & AI";
    }
    if (s.includes("zero-trust") || s.includes("security") || s.includes("cyber")) {
      return "Cybersecurity";
    }
    return "Business";
  };

  // Automatically highlight/select the category of the first matching course when searching
  useEffect(() => {
    if (searchTerm.trim() !== "") {
      const match = initialCourses.find(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (match) {
        const cat = getCourseCategory(match);
        setActiveCategory(cat);
      }
    }
  }, [searchTerm, initialCourses]);

  // Filter courses based on active tab and search query
  const filteredCourses = initialCourses.filter((course) => {
    const category = getCourseCategory(course);
    const matchesCategory = category === activeCategory;
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = async (courseId: string, courseTitle: string) => {
    if (!user) {
      router.push("/login?callbackUrl=/");
      return;
    }

    setAddingCourseId(courseId);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, userId: user.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`"${courseTitle}" added to shopping cart!`);
      } else {
        showToast(data.error || "Failed to add course to cart.");
      }
    } catch (err) {
      showToast("Network warning: Action aborted.");
    } finally {
      setAddingCourseId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getGradientForCategory = (category: string) => {
    return "from-primary to-brand-sky bg-gradient-to-br";
  };

  const categories = ["Development", "Data Science & AI", "Cybersecurity", "Business"];

  return (
    <div className="space-y-16 pb-20 animate-fade-in text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Dynamic Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-950 p-4 rounded-xl shadow-lg border border-slate-800 dark:border-slate-200 text-xs font-bold animate-bounce flex items-center gap-2">
          <span className="text-emerald-500">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* A. Search Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-14 md:pt-24 md:pb-20 border-b border-white/10 bg-gradient-to-br from-brand-sky to-brand-sky-light text-white">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.15))] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 text-white font-bold text-[10px] uppercase tracking-wider">
            🚀 Career Acceleration & Placements Platform
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight max-w-2xl mx-auto">
            The Rigorous Path to High-End Engineering Internships
          </h1>

          <p className="text-xs md:text-sm text-white/90 max-w-xl mx-auto leading-relaxed font-medium">
            Learn Next.js server architectures, Explainable AI models, and Zero Trust security architectures. Complete code assignments, pass timed quizzes, and unlock placements.
          </p>

          {/* Centered Premium Search Input */}
          <div className="max-w-md mx-auto pt-4 relative text-slate-900">
            <input
              type="text"
              placeholder="What do you want to learn today?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-5 pr-12 py-3.5 rounded-full border-none bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-md transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* B. Category Navigation Tabs System */}
      <section className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="border-b border-slate-200/80 dark:border-slate-800 pb-3 flex flex-wrap gap-2 items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">A Broad Selection of Courses</h2>
            <p className="text-[11px] text-slate-405 text-slate-400 font-medium">Choose from 10,000+ interactive courses with micro-assignments</p>
          </div>
          
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-850">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                  activeCategory === cat
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* C. Udemy-Scale Showcase Shelf Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <svg className="w-10 h-10 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-bold text-xs text-slate-700 dark:text-slate-350">No courses match your search criteria.</h3>
            <p className="text-[10px] text-slate-400 mt-1">Try selecting another tab or resetting your query string.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <Link href={`/courses/${course.slug}`} className="flex flex-col flex-grow group cursor-pointer">
                  {/* Visual Thumbnail Category Gradient */}
                  <div className={`h-28 w-full p-4 relative flex flex-col justify-between text-white ${getGradientForCategory(activeCategory)}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
                        {activeCategory}
                      </span>
                      <span className="text-[8px] uppercase tracking-wider font-extrabold bg-white/25 px-2 py-0.5 rounded backdrop-blur-sm">
                        Pro Track
                      </span>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase font-bold tracking-widest leading-none opacity-80">Syllabus Track</h4>
                      <span className="text-xs font-extrabold block truncate group-hover:underline">{course.title}</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2 text-xs font-semibold">
                    <div className="space-y-2">
                      <h3 className="text-sm font-extrabold uppercase text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="text-xs text-slate-400 font-medium">
                        Instructor: <span className="text-slate-700 dark:text-slate-300 font-bold">Dr. Bhavik Kumar</span>
                      </div>

                      {/* Star Rating Loops */}
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500 text-xs font-bold">4.9</span>
                        <div className="flex text-amber-500 text-[10px]">
                          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                        </div>
                        <span className="text-[10px] text-slate-450 text-slate-400">(428 reviews)</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span>{course.modulesCount} Modules</span>
                        <span>•</span>
                        <span>{course.slotsCount > 0 ? `${course.slotsCount} Live Classes` : "Self-paced"}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="p-4 pt-0 text-xs font-semibold">
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-900 flex justify-between items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-slate-400 uppercase tracking-wider leading-none">Enrollment Fee</span>
                      <span className="text-sm font-extrabold text-primary">
                        ₹{course.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                      >
                        Preview
                      </Link>
                      
                      {/* D. High-Conversion Add-to-Cart Hook */}
                      <button
                        type="button"
                        disabled={addingCourseId === course.id}
                        onClick={() => handleAddToCart(course.id, course.title)}
                        className="px-3.5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-sm flex items-center gap-1"
                      >
                        {addingCourseId === course.id ? (
                          <span className="w-2.5 h-2.5 rounded-full border-t border-white animate-spin" />
                        ) : (
                          <span>+ Add to Cart</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trust guarantees badge sections */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="rounded-2xl border border-slate-250 border-slate-200/60 dark:border-slate-800 p-6 md:p-8 bg-white dark:bg-slate-950 flex flex-wrap items-center justify-around gap-6 text-center text-xs">
          <div className="space-y-1">
            <div className="font-extrabold text-indigo-650 dark:text-indigo-400 text-lg">10k+</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Trained Learners</div>
          </div>
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-900 hidden md:block" />
          <div className="space-y-1">
            <div className="font-extrabold text-indigo-655 text-indigo-600 dark:text-indigo-400 text-lg">98%</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Assessment Clearance</div>
          </div>
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-900 hidden md:block" />
          <div className="space-y-1">
            <div className="font-extrabold text-indigo-655 text-indigo-600 dark:text-indigo-400 text-lg">₹6.5 LPA</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Average Placement Package</div>
          </div>
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-900 hidden md:block" />
          <div className="space-y-1">
            <div className="font-extrabold text-indigo-655 text-indigo-600 dark:text-indigo-400 text-lg">24/7</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Live Mentorship Support</div>
          </div>
        </div>
      </section>

      {/* Standard Testimonials Showcase */}
      <section className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-white">Internship Success Stories</h2>
          <p className="text-[11px] text-slate-400">Hear from our students working at top-tier companies worldwide</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-xs">
          <div className="rounded-xl border border-slate-205 border-slate-200/60 dark:border-slate-800 p-5 bg-white dark:bg-slate-950 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <strong className="block text-slate-800 dark:text-slate-200 font-bold">Siddharth Verma</strong>
                <span className="text-[10px] text-slate-400 font-medium">Software Engineer Intern @ Vercel</span>
              </div>
              <div className="text-amber-500 font-bold">★★★★★</div>
            </div>
            <p className="italic text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              &quot;The advanced React Server Components modules gave me the precise systems perspective to pass the technical assessments easily.&quot;
            </p>
          </div>

          <div className="rounded-xl border border-slate-205 border-slate-200/60 dark:border-slate-800 p-5 bg-white dark:bg-slate-950 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <strong className="block text-slate-800 dark:text-slate-200 font-bold">Priya Sharma</strong>
                <span className="text-[10px] text-slate-400 font-medium">AI Engineer @ Stripe</span>
              </div>
              <div className="text-amber-500 font-bold">★★★★★</div>
            </div>
            <p className="italic text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              &quot;The Python Machine learning tracks are exceptionally detailed. Standardized quizzes and instant XP dashboard feedback keep you motivated.&quot;
            </p>
          </div>

          <div className="rounded-xl border border-slate-205 border-slate-200/60 dark:border-slate-800 p-5 bg-white dark:bg-slate-950 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <strong className="block text-slate-800 dark:text-slate-200 font-bold">Rahul Patel</strong>
                <span className="text-[10px] text-slate-400 font-medium">Security Analyst @ Cloudflare</span>
              </div>
              <div className="text-amber-500 font-bold">★★★★★</div>
            </div>
            <p className="italic text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              &quot;Learned zero-trust networks and role policies in depth. It has hands-on setup steps that replicate authentic corporate tasks.&quot;
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

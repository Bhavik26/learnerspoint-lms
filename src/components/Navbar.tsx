"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NavbarProps {
  user: {
    id?: string;
    name: string;
    email: string;
    role?: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cartCount, setCartCount] = useState(0);
  const [navSearch, setNavSearch] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    // Register Capacitor deep linking listener dynamically on client browser mount
    import("@/lib/mobileBridge").then(({ setupDeepLinks }) => {
      setupDeepLinks(router, (token) => {
        // Save the received OAuth token as a cookie
        document.cookie = `token=${token}; path=/; max-age=${60*60*24*7}`;
        // Force refresh page to trigger server layout validation
        router.refresh();
      });
    });
  }, [router]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    
    async function fetchCartCount() {
      try {
        const url = user && user.id ? `/api/cart?userId=${user.id}` : "/api/cart";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.items) {
            setCartCount(data.items.length);
          }
        }
      } catch (err) {
        console.warn("Cart API status offline.");
      }
    }

    fetchCartCount();
    const interval = setInterval(fetchCartCount, 4000);
    return () => clearInterval(interval);
  }, [user]);
  
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!navSearch) return;
    router.push(`/dashboard?q=${encodeURIComponent(navSearch)}`);
  };

  const getUserInitials = () => {
    if (!user || !user.name) return "U";
    return user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-50 transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4.5 flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Left Side: Brand Logo and Text Links */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <Link 
            href="/" 
            className="font-extrabold tracking-tight text-xl sm:text-2xl text-primary font-sans hover:opacity-90 transition-all flex items-center gap-0.5"
          >
            <span>LearnersPoint</span>
            <span className="text-secondary font-black">.</span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-5 text-sm font-bold text-slate-600 dark:text-slate-350">
            <Link href="/" className="hover:text-primary transition-colors">
              Find Courses
            </Link>
            <Link href="/courses" className="hover:text-primary transition-colors">
              Get Certified
            </Link>
            <Link href="/subscribe" className="hover:text-secondary transition-colors font-extrabold">
              Subscribe
            </Link>
          </nav>
        </div>

        {/* Center: Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg relative hidden md:block">
          <input
            type="text"
            placeholder="Search for anything..."
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-800 dark:text-slate-200 transition-all"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </form>

        {/* Right Side: Additional links, theme, cart, and authentication */}
        <div className="flex items-center gap-2 sm:gap-5 text-sm font-bold text-slate-600 dark:text-slate-305 shrink-0">
          
          {/* Leaderboard Link */}
          <Link href="/leaderboard" className="hover:text-primary transition-colors hidden sm:block">
            Leaderboard
          </Link>

          {/* Contact Us Link */}
          <Link href="/contact" className="hover:text-primary transition-colors hidden sm:block">
            Contact Us
          </Link>

          {/* Cart Icon Badge */}
          {user && (
            <Link 
              href="/cart" 
              className="relative p-2 text-slate-500 hover:text-primary transition-colors flex items-center justify-center"
              aria-label="View shopping cart"
            >
              {/* Shopping Cart SVG icon */}
              <svg className="w-5.5 h-5.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-primary text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>
          )}



          {/* User profiles state actions */}
          {user ? (
            <div className="relative flex items-center gap-3">
              {/* Profile Avatar trigger */}
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xs font-black cursor-pointer hover:bg-primary/15 transition-all"
                title={user.name}
              >
                {getUserInitials()}
              </button>

              {/* Profile Dropdown panel */}
              {showProfileMenu && (
                <div className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-white dark:bg-slate-950 shadow-lg text-xs space-y-2">
                  <div className="pb-2 border-b border-slate-100 dark:border-slate-900">
                    <span className="block font-black text-slate-800 dark:text-slate-200 truncate">{user.name}</span>
                    <span className="block text-[10px] text-slate-400 font-medium truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left py-1.5 text-red-500 hover:underline font-bold cursor-pointer"
                  >
                    Logout Session
                  </button>
                </div>
              )}

              {/* Instant Logout Action */}
              <button
                onClick={handleLogout}
                className="hidden sm:block rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-305 px-3.5 py-2 text-[11px] font-bold cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link 
                href="/login" 
                className="px-2.5 py-2 sm:px-4 sm:py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap"
              >
                Log In
              </Link>
              <Link 
                href="/register" 
                className="px-2.5 py-2 sm:px-4 sm:py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-[10px] sm:text-xs font-bold shadow-sm animate-pulse-fast whitespace-nowrap"
              >
                Sign Up
              </Link>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-3 px-5 overflow-x-auto scrollbar-none flex justify-between gap-5 text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
        <Link href="/" className="shrink-0 hover:text-primary transition-colors">Find Courses</Link>
        <Link href="/courses" className="shrink-0 hover:text-primary transition-colors">Get Certified</Link>
        <Link href="/subscribe" className="shrink-0 hover:text-secondary font-black transition-colors">Subscribe</Link>
        <Link href="/leaderboard" className="shrink-0 hover:text-primary transition-colors">Leaderboard</Link>
        <Link href="/contact" className="shrink-0 hover:text-primary transition-colors">Contact Us</Link>
      </div>
    </header>
  );
}

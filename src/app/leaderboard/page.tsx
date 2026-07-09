import { db } from "@/lib/db";
import Link from "next/link";

export const revalidate = 0;

interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  xp: number;
  rank: number;
}

export default async function LeaderboardPage() {
  let entries: LeaderboardEntry[] = [];
  let isMocked = false;

  try {
    const list = await db.userXP.findMany({
      orderBy: { currentXp: "desc" },
      include: {
        user: true,
      },
    });

    if (list.length > 0) {
      entries = list.map((record) => ({
        id: record.id,
        name: record.user.name,
        email: record.user.email,
        xp: record.currentXp,
        rank: record.globalRank,
      }));
    } else {
      throw new Error("No entries");
    }
  } catch (err) {
    console.warn("DB offline or no XP records. Serving mock rankings.");
    isMocked = true;
    entries = [
      { id: "mock-1", name: "student_0x5c", email: "stripe_intern@stripe.com", xp: 750, rank: 1 },
      { id: "mock-2", name: "developer_args", email: "vercel_intern@vercel.com", xp: 520, rank: 2 },
      { id: "mock-3", name: "rust_coder", email: "cf_intern@cloudflare.com", xp: 360, rank: 3 },
      { id: "mock-4", name: "noob_hacker", email: "hacker@example.com", xp: 180, rank: 4 },
      { id: "mock-5", name: "syntax_seeker", email: "seeker@example.com", xp: 80, rank: 5 }
    ];
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400";
      case 2:
        return "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-300";
      case 3:
        return "border-amber-600/25 bg-amber-50/20 dark:bg-amber-950/10 text-amber-800 dark:text-amber-500";
      default:
        return "border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200";
    }
  };

  const getBadgeTitle = (xp: number) => {
    if (xp >= 600) return "STACK OVERLORD";
    if (xp >= 300) return "ARCADE CHAMPION";
    if (xp >= 100) return "SYNTAX SURVIVOR";
    return "NOOB CODER";
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-6 space-y-8 animate-fade-in text-slate-900 dark:text-slate-100">
      <div className="pb-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Global Leaderboard</h1>
          <p className="text-xs text-slate-400 font-medium">Global platform rankings by user experience points (XP).</p>
        </div>
        {isMocked && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400 border border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full font-bold">
            Ranks Simulation
          </span>
        )}
      </div>

      <div className="space-y-4">
        {entries.map((entry) => {
          const cardStyle = getRankStyle(entry.rank);

          return (
            <div 
              key={entry.id}
              className={`p-4 flex items-center justify-between border rounded-2xl gap-4 hover:-translate-y-0.5 transition-all duration-200 shadow-sm ${cardStyle}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-base font-bold shadow-sm">
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{entry.name}</span>
                    <span className="text-[10px] text-slate-400">({entry.email.split("@")[0]})</span>
                  </div>
                  <span className="text-[10px] block text-slate-400 mt-1 uppercase font-bold tracking-wider">
                    Badge: <strong className="text-indigo-650 dark:text-indigo-400">{getBadgeTitle(entry.xp)}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-extrabold block text-slate-850 dark:text-slate-200">{entry.xp} XP</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">platform level</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900/50 text-center text-xs space-y-3 font-medium">
        <p className="text-slate-400 leading-relaxed max-w-md mx-auto">
          Quizzes award 100 XP points upon completion. System scores are verified and cataloged dynamically. Join the course quest lines to assert your standing!
        </p>
        <Link href="/dashboard/courses" className="inline-block text-indigo-600 dark:text-indigo-400 font-bold hover:underline uppercase text-[10px] tracking-wider pt-1">
          Start Your Quest Line →
        </Link>
      </div>
    </div>
  );
}

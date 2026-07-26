"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Award, Flame, Eye, Package, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { BADGE_CONFIGS } from "@/lib/badge-config";

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  stat_value: number;
  badges: string[];
};

export default function LeaderboardPage() {
  const [category, setCategory] = useState("most_adopted");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const res = await fetch(`/api/leaderboard?category=${category}`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [category]);

  const getCategoryLabel = () => {
    switch (category) {
      case "most_adopted":
        return "Adoptions Completed";
      case "most_salvaged":
        return "Snippets Salvaged";
      case "most_buried":
        return "Projects Buried";
      case "most_viewed":
        return "Total Project Views";
      default:
        return "Count";
    }
  };

  return (
    <div className="w-full space-y-8 max-w-6xl mx-auto py-4">
      {/* Header Banner */}
      <section className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-purple-950/40 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 mb-3">
              <Trophy className="h-3.5 w-3.5 text-purple-400" />
              Community Leaderboard & Badges
            </div>
            <h1 className="text-3xl font-extrabold text-white">Graveyard Top Contributors</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Surfacing developer contributions across project burials, salvaged snippets, and completed project adoptions.
            </p>
          </div>
        </div>

        {/* Privacy & Anonymity Callout */}
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 text-xs text-zinc-400">
          <Info className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-200">Anonymity & Aggregate Rankings Notice:</span>{" "}
            Leaderboard stats aggregate a user&apos;s total contributions (including anonymous burials). While individual project post-mortems marked as anonymous remain strictly sanitized without author attribution, total count contributions contribute to user ranks and badge progression.
          </div>
        </div>
      </section>

      {/* Available Badges Showcase */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-purple-400" />
          Earnable Platform Badges
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(BADGE_CONFIGS).map((b) => (
            <div key={b.key} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 flex items-start gap-3">
              <span className="text-2xl p-2 rounded-md bg-zinc-900 border border-zinc-800">{b.icon}</span>
              <div>
                <h3 className="font-semibold text-sm text-white">{b.title}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{b.description}</p>
                <span className="inline-block mt-2 text-[10px] font-medium text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                  {b.criteria}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Tabs & Rankings Table */}
      <Tabs value={category} onValueChange={setCategory} className="w-full">
        <TabsList className="bg-zinc-900 grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="most_adopted" className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-purple-400" />
            Most Adopted
          </TabsTrigger>
          <TabsTrigger value="most_salvaged" className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" />
            Most Salvaged
          </TabsTrigger>
          <TabsTrigger value="most_buried" className="flex items-center gap-2">
            <Package className="h-4 w-4 text-zinc-400" />
            Most Buried
          </TabsTrigger>
          <TabsTrigger value="most_viewed" className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-400" />
            Most Viewed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={category} className="mt-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-zinc-400 animate-pulse">Loading rankings...</div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">No leaderboard entries found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-950/60 text-xs uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="px-6 py-3.5 w-16 text-center">Rank</th>
                      <th className="px-6 py-3.5">Contributor</th>
                      <th className="px-6 py-3.5 text-right">{getCategoryLabel()}</th>
                      <th className="px-6 py-3.5 text-right">Badges</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {leaderboard.map((entry) => (
                      <tr key={entry.user_id} className="hover:bg-zinc-800/40 transition-colors">
                        {/* Rank Badge */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ${
                              entry.rank === 1
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                                : entry.rank === 2
                                ? "bg-zinc-300/20 text-zinc-200 border border-zinc-300/40"
                                : entry.rank === 3
                                ? "bg-amber-700/20 text-amber-400 border border-amber-700/40"
                                : "text-zinc-400"
                            }`}
                          >
                            {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                          </span>
                        </td>

                        {/* Contributor Profile Info */}
                        <td className="px-6 py-4">
                          <Link href={`/profile/${entry.username}`} className="flex items-center gap-3 group">
                            <Avatar className="h-10 w-10 border border-zinc-700">
                              <AvatarImage src={entry.avatar_url || ""} alt={entry.username} />
                              <AvatarFallback>{entry.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                                {entry.full_name || `@${entry.username}`}
                              </div>
                              <div className="text-xs text-zinc-400">@{entry.username}</div>
                            </div>
                          </Link>
                        </td>

                        {/* Category Stat Count */}
                        <td className="px-6 py-4 text-right font-bold text-white text-base">
                          {entry.stat_value.toLocaleString()}
                        </td>

                        {/* Badges Column */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end">
                            <ProfileBadges badgeKeys={entry.badges} size="sm" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

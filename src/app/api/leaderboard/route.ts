import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { MOCK_USERS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "most_adopted";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    const supabase = createServerClient();

    // Map category parameter to SQL column and ordering
    let orderByColumn = "total_adoptions_completed";
    if (category === "most_salvaged") orderByColumn = "total_snippets_salvaged";
    if (category === "most_buried") orderByColumn = "total_projects_buried";
    if (category === "most_viewed") orderByColumn = "total_views_received";

    const { data: stats, error } = await supabase
      .from("leaderboard_stats")
      .select("*")
      .order(orderByColumn, { ascending: false })
      .limit(limit);

    if (error || !stats || stats.length === 0) {
      // Fallback mock leaderboard if Supabase is offline or empty
      const mockLeaderboard = MOCK_USERS.slice(0, limit).map((u, idx) => ({
        rank: idx + 1,
        user_id: u.id,
        username: u.username,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        stat_value:
          category === "most_adopted"
            ? 12 - idx * 2
            : category === "most_salvaged"
            ? 25 - idx * 3
            : category === "most_buried"
            ? 15 - idx * 2
            : 1400 - idx * 150,
        badges: idx === 0 ? ["gravedigger", "necromancer", "community_pillar"] : idx === 1 ? ["salvager"] : ["gravedigger"],
      }));

      return NextResponse.json({
        category,
        count: mockLeaderboard.length,
        leaderboard: mockLeaderboard,
      });
    }

    // Fetch badges for top users
    const userIds = stats.map((s: any) => s.user_id);
    const { data: userBadges } = await supabase
      .from("user_badges")
      .select("user_id, badge_key")
      .in("user_id", userIds);

    const badgeMap = new Map<string, string[]>();
    (userBadges || []).forEach((b: any) => {
      const existing = badgeMap.get(b.user_id) || [];
      existing.push(b.badge_key);
      badgeMap.set(b.user_id, existing);
    });

    const leaderboard = stats.map((s: any, idx: number) => {
      let stat_value = s.total_adoptions_completed;
      if (category === "most_salvaged") stat_value = s.total_snippets_salvaged;
      if (category === "most_buried") stat_value = s.total_projects_buried;
      if (category === "most_viewed") stat_value = s.total_views_received;

      return {
        rank: idx + 1,
        user_id: s.user_id,
        username: s.username,
        full_name: s.full_name,
        avatar_url: s.avatar_url,
        stat_value: stat_value || 0,
        total_projects_buried: s.total_projects_buried,
        total_adoptions_completed: s.total_adoptions_completed,
        total_snippets_salvaged: s.total_snippets_salvaged,
        total_views_received: s.total_views_received,
        badges: badgeMap.get(s.user_id) || [],
      };
    });

    return NextResponse.json({
      category,
      count: leaderboard.length,
      leaderboard,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

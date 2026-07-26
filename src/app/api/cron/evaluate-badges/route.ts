import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  return handleEvaluateBadges(request);
}

export async function POST(request: Request) {
  return handleEvaluateBadges(request);
}

async function handleEvaluateBadges(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      const { searchParams } = new URL(request.url);
      const secretParam = searchParams.get("secret");

      const isAuthorized =
        authHeader === `Bearer ${cronSecret}` || secretParam === cronSecret;

      if (!isAuthorized) {
        return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
      }
    }

    const supabase = createServerClient();

    // 1. Run stored procedure evaluate_user_badges()
    const { error: evalErr } = await supabase.rpc("evaluate_user_badges");
    if (evalErr) {
      console.warn("[Badge Evaluation RPC Warning]:", evalErr.message);
    }

    // 2. Capture weekly snapshots for top 20 across categories
    const categories = [
      { name: "most_adopted", col: "total_adoptions_completed" },
      { name: "most_salvaged", col: "total_snippets_salvaged" },
      { name: "most_buried", col: "total_projects_buried" },
      { name: "most_viewed", col: "total_views_received" },
    ];

    const todayDate = new Date().toISOString().split("T")[0];
    let snapshotsCreated = 0;

    for (const cat of categories) {
      const { data: topUsers } = await supabase
        .from("leaderboard_stats")
        .select(`user_id, ${cat.col}`)
        .order(cat.col, { ascending: false })
        .limit(20);

      if (topUsers && topUsers.length > 0) {
        const snapshots = topUsers.map((u: any, idx: number) => ({
          snapshot_date: todayDate,
          user_id: u.user_id,
          category: cat.name,
          rank: idx + 1,
          stat_value: u[cat.col] || 0,
        }));

        const { error: snapErr } = await supabase
          .from("weekly_leaderboard_snapshots")
          .upsert(snapshots, { onConflict: "snapshot_date, category, user_id" });

        if (!snapErr) {
          snapshotsCreated += snapshots.length;
        }
      }
    }

    return NextResponse.json({
      status: "success",
      message: "Badges evaluated and weekly snapshots captured successfully.",
      snapshots_captured: snapshotsCreated,
    });
  } catch (err: any) {
    console.error("[Evaluate Badges Exception]:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

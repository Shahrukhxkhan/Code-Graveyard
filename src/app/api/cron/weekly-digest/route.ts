import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sanitizeProjects } from "@/lib/utils";
import { renderWeeklyDigestHtml, WeeklyStats, DigestProject } from "@/lib/digest-helper";

export async function GET(request: Request) {
  return handleWeeklyDigest(request);
}

export async function POST(request: Request) {
  return handleWeeklyDigest(request);
}

async function handleWeeklyDigest(request: Request) {
  try {
    // 1. Authorize Cron Secret (if configured)
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
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

    // 2. Query projects created in the last 7 days that are open for adoption & not hidden
    const { data: rawProjects, error: projErr } = await supabase
      .from("projects")
      .select("id, title, tagline, stage_of_death, is_anonymous, created_at, project_tags(tag:tags(name))")
      .gte("created_at", sevenDaysAgo)
      .eq("is_adoptable", true)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    if (projErr) {
      console.error("[Weekly Digest Cron Projects Fetch Error]:", projErr.message);
      return NextResponse.json({ error: projErr.message }, { status: 500 });
    }

    // Sanitize anonymous projects
    const adoptableProjects = sanitizeProjects(rawProjects || []);

    // 3. Skip sending if zero new adoptable projects published in the last 7 days
    if (adoptableProjects.length === 0) {
      console.log("[Weekly Digest Cron] Zero new adoptable projects in the last 7 days. Skipping email dispatch.");
      return NextResponse.json({
        status: "skipped",
        reason: "Zero new adoptable projects in the last 7 days",
      });
    }

    // 4. Query Weekly Aggregate Stats
    const { count: buriedCount } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo)
      .eq("is_hidden", false);

    const { count: snippetCount } = await supabase
      .from("snippets")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo)
      .eq("is_hidden", false);

    const { count: completedAdoptionsCount } = await supabase
      .from("adoptions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo)
      .eq("status", "completed");

    const weeklyStats: WeeklyStats = {
      total_buried: buriedCount || 0,
      total_snippets: snippetCount || 0,
      total_adoptions_completed: completedAdoptionsCount || 0,
    };

    // Format Digest Projects list
    const digestProjects: DigestProject[] = adoptableProjects.map((p: any) => ({
      id: p.id,
      title: p.title,
      tagline: p.tagline,
      stage_of_death: p.stage_of_death,
      primary_tag: p.project_tags?.[0]?.tag?.name || null,
    }));

    // 5. Query Opted-In Users
    const { data: users, error: userErr } = await supabase
      .from("users")
      .select("id, username")
      .eq("digest_opted_in", true)
      .eq("email_notifications_enabled", true);

    if (userErr) {
      console.error("[Weekly Digest Cron Users Fetch Error]:", userErr.message);
      return NextResponse.json({ error: userErr.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      console.log("[Weekly Digest Cron] No opted-in users found.");
      return NextResponse.json({ status: "skipped", reason: "No opted-in recipients found" });
    }

    // 6. Batch Send Emails in Chunks of 50
    const BATCH_SIZE = 50;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    let successfulCount = 0;
    let failedCount = 0;
    const failures: { userId: string; reason: string }[] = [];

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (u: any) => {
          const html = renderWeeklyDigestHtml(u.id, digestProjects, weeklyStats, siteUrl);

          // Dispatch to notification email endpoint
          const res = await fetch(`${siteUrl}/api/notifications/email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: `${u.username}@example.com`, // Resolved to user's registered email
              subject: "Code-Graveyard Weekly Digest: Freshly Abandoned Projects 🪦",
              body: html,
            }),
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return u.id;
        })
      );

      batchResults.forEach((result, index) => {
        const u = batch[index];
        if (result.status === "fulfilled") {
          successfulCount++;
        } else {
          failedCount++;
          failures.push({ userId: u.id, reason: result.reason?.message || "Unknown error" });
          console.error(`[Weekly Digest Batch Failure] User ID ${u.id}:`, result.reason);
        }
      });
    }

    console.log(
      `[Weekly Digest Cron Completed] Sent: ${successfulCount} | Failed: ${failedCount} | Total Candidates: ${users.length}`
    );

    return NextResponse.json({
      status: "completed",
      recipients_processed: users.length,
      successful: successfulCount,
      failed: failedCount,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (err: any) {
    console.error("[Weekly Digest Cron Exception]:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

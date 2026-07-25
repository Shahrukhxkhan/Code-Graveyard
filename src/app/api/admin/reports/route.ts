import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

async function verifyAdmin(supabase: ReturnType<typeof createServerClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return { isAdmin: Boolean(profile?.is_admin), user };
}

export async function GET() {
  try {
    const supabase = createServerClient();
    const { isAdmin } = await verifyAdmin(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    // Fetch all pending reports with reporter info
    const { data: reports, error } = await supabase
      .from("reports")
      .select(`
        *,
        reporter:users!reporter_id (
          id,
          username,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch reports." },
        { status: 500 }
      );
    }

    // Populate target preview information
    const reportsWithTargets = await Promise.all(
      (reports || []).map(async (report: any) => {
        let project_target = null;
        let snippet_target = null;

        if (report.target_type === "project") {
          const { data: p } = await supabase
            .from("projects")
            .select("id, title, tagline, is_hidden, user_id")
            .eq("id", report.target_id)
            .single();
          project_target = p;
        } else if (report.target_type === "snippet") {
          const { data: s } = await supabase
            .from("snippets")
            .select("id, title, description, code, language, is_hidden, project_id")
            .eq("id", report.target_id)
            .single();
          snippet_target = s;
        }

        return {
          ...report,
          project_target,
          snippet_target,
        };
      })
    );

    return NextResponse.json({ reports: reportsWithTargets });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const { isAdmin, user } = await verifyAdmin(supabase);

    if (!isAdmin || !user) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { report_id, action } = body;

    if (!report_id || !["dismiss", "action"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid report_id or action parameter. Action must be 'dismiss' or 'action'." },
        { status: 400 }
      );
    }

    // 1. Fetch the report
    const { data: report, error: fetchErr } = await supabase
      .from("reports")
      .select("*")
      .eq("id", report_id)
      .single();

    if (fetchErr || !report) {
      return NextResponse.json(
        { error: "Report not found." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const newStatus = action === "action" ? "actioned" : "dismissed";

    // 2. If taking action, hide the target content (soft-delete)
    if (action === "action") {
      if (report.target_type === "project") {
        const { error: hideErr } = await supabase
          .from("projects")
          .update({ is_hidden: true })
          .eq("id", report.target_id);

        if (hideErr) {
          return NextResponse.json(
            { error: `Failed to hide target project: ${hideErr.message}` },
            { status: 500 }
          );
        }
      } else if (report.target_type === "snippet") {
        const { error: hideErr } = await supabase
          .from("snippets")
          .update({ is_hidden: true })
          .eq("id", report.target_id);

        if (hideErr) {
          return NextResponse.json(
            { error: `Failed to hide target snippet: ${hideErr.message}` },
            { status: 500 }
          );
        }
      }
    }

    // 3. Update report status, reviewed_at, and reviewed_by
    const { data: updatedReport, error: updateErr } = await supabase
      .from("reports")
      .update({
        status: newStatus,
        reviewed_at: now,
        reviewed_by: user.id,
      })
      .eq("id", report_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message || "Failed to update report status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: action === "action" ? "Target hidden and report marked as actioned." : "Report dismissed.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

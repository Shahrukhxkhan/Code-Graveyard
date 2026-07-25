import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to submit a report." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { target_type, target_id, reason, details } = body;

    // 1. Input Validation
    if (!target_type || !["project", "snippet"].includes(target_type)) {
      return NextResponse.json(
        { error: "Invalid target_type. Must be 'project' or 'snippet'." },
        { status: 400 }
      );
    }

    if (!target_id || typeof target_id !== "string") {
      return NextResponse.json(
        { error: "Invalid target_id." },
        { status: 400 }
      );
    }

    const validReasons = ["spam", "harassment", "plagiarism", "inappropriate", "other"];
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid reason." },
        { status: 400 }
      );
    }

    // 2. Rate Limiting Check (Maximum 5 reports per hour per user)
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("reporter_id", user.id)
      .gte("created_at", oneHourAgo);

    if (!countError && count !== null && count >= 5) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can only submit up to 5 reports per hour." },
        { status: 429 }
      );
    }

    // 3. Insert Report
    const { data: newReport, error: insertError } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        target_type,
        target_id,
        reason,
        details: details ? String(details).trim() : null,
      })
      .select()
      .single();

    if (insertError) {
      // 23505 = Postgres unique constraint violation
      if (insertError.code === "23505" || insertError.message?.includes("unique")) {
        return NextResponse.json(
          { error: "You have already reported this item." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: insertError.message || "Failed to create report." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, report: newReport },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

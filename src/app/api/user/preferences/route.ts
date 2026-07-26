import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("email_notifications_enabled, digest_opted_in")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      email_notifications_enabled: profile?.email_notifications_enabled ?? true,
      digest_opted_in: profile?.digest_opted_in ?? true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email_notifications_enabled, digest_opted_in } = body;

    const updates: Record<string, boolean> = {};
    if (typeof email_notifications_enabled === "boolean") {
      updates.email_notifications_enabled = email_notifications_enabled;
    }
    if (typeof digest_opted_in === "boolean") {
      updates.digest_opted_in = digest_opted_in;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid preference fields provided" }, { status: 400 });
    }

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ...updates,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

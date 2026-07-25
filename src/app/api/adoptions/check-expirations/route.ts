import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Query accepted adoptions where deadline has passed
    const { data: expiredAdoptions, error } = await supabase
      .from("adoptions")
      .select(`
        id,
        project_id,
        adopter_id,
        responded_by_deadline,
        project:projects (
          id,
          title,
          user_id
        )
      `)
      .eq("status", "accepted")
      .lt("responded_by_deadline", now);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const notifiedCount = (expiredAdoptions || []).length;

    for (const adoption of expiredAdoptions || []) {
      const proj = adoption.project as any;
      if (!proj) continue;

      // Surface project back as adoptable
      await supabase
        .from("projects")
        .update({ is_adoptable: true })
        .eq("id", proj.id);

      // Notify project owner
      await supabase.from("notifications").insert({
        user_id: proj.user_id,
        type: "adoption_deadline_expired",
        title: "Handoff Deadline Expired",
        body: `The handoff deadline for "${proj.title}" passed. The adopter appears unresponsive. Please mark it "Abandoned by Adopter" to reopen to superseded applicants, or extend the deadline.`,
        related_project_id: proj.id,
        related_adoption_id: adoption.id,
      });
    }

    return NextResponse.json({
      success: true,
      expired_count: notifiedCount,
      message: `Checked expirations. Processed ${notifiedCount} expired adoptions.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

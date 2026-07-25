import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { captureApiError } from "@/lib/sentry-helper";

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, adoption_id, project_id, days } = body;

    const validActions = [
      "accept",
      "reject",
      "complete",
      "abandon_by_adopter",
      "extend_deadline",
      "re_request",
    ];

    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // ACTION: RE-REQUEST (For previously superseded adopters)
    // ------------------------------------------------------------------------
    if (action === "re_request") {
      if (!project_id) {
        return NextResponse.json(
          { error: "project_id is required for re_request action." },
          { status: 400 }
        );
      }

      // Check project state
      const { data: project, error: pErr } = await supabase
        .from("projects")
        .select("id, title, is_adoptable, user_id")
        .eq("id", project_id)
        .single();

      if (pErr || !project) {
        return NextResponse.json({ error: "Project not found." }, { status: 404 });
      }

      if (!project.is_adoptable) {
        return NextResponse.json(
          { error: "This project is not currently open for adoption." },
          { status: 400 }
        );
      }

      if (project.user_id === user.id) {
        return NextResponse.json(
          { error: "You cannot adopt your own project." },
          { status: 400 }
        );
      }

      // Check if user already has an adoption record for this project
      const { data: existingAdoption } = await supabase
        .from("adoptions")
        .select("id, status")
        .eq("project_id", project_id)
        .eq("adopter_id", user.id)
        .maybeSingle();

      let targetAdoptionId = existingAdoption?.id;

      if (existingAdoption) {
        const { error: updateErr } = await supabase
          .from("adoptions")
          .update({
            status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAdoption.id);

        if (updateErr) {
          return NextResponse.json({ error: updateErr.message }, { status: 500 });
        }
      } else {
        const { data: newAdoption, error: insErr } = await supabase
          .from("adoptions")
          .insert({
            project_id,
            adopter_id: user.id,
            message: "Re-requested adoption application.",
            status: "pending",
          })
          .select("id")
          .single();

        if (insErr) {
          return NextResponse.json({ error: insErr.message }, { status: 500 });
        }
        targetAdoptionId = newAdoption.id;
      }

      // Notify Project Owner
      await supabase.from("notifications").insert({
        user_id: project.user_id,
        type: "adoption_request",
        title: "New Adoption Re-application",
        body: `A developer re-requested to adopt "${project.title}".`,
        related_project_id: project_id,
        related_adoption_id: targetAdoptionId,
      });

      return NextResponse.json({
        success: true,
        message: "Re-request submitted successfully.",
      });
    }

    // ------------------------------------------------------------------------
    // OWNER-SIDE ACTIONS REQUIRE ADOPTION_ID
    // ------------------------------------------------------------------------
    if (!adoption_id) {
      return NextResponse.json(
        { error: "adoption_id is required." },
        { status: 400 }
      );
    }

    // Fetch adoption details along with project details
    const { data: adoption, error: fetchErr } = await supabase
      .from("adoptions")
      .select(`
        *,
        project:projects (
          id,
          title,
          user_id,
          is_adoptable
        )
      `)
      .eq("id", adoption_id)
      .single();

    if (fetchErr || !adoption || !adoption.project) {
      return NextResponse.json(
        { error: "Adoption record not found." },
        { status: 404 }
      );
    }

    // Authorization: User must be the owner of the project
    if (adoption.project.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: Only the project owner can perform this resolution action." },
        { status: 403 }
      );
    }

    const projectTitle = adoption.project.title;
    const projectId = adoption.project.id;
    const now = new Date();

    // ------------------------------------------------------------------------
    // ACTION: ACCEPT
    // ------------------------------------------------------------------------
    if (action === "accept") {
      const deadlineDays = days && Number(days) > 0 ? Number(days) : 14;
      const deadlineDate = new Date(now.getTime() + deadlineDays * 86400 * 1000).toISOString();

      // 1. Set selected adoption to 'accepted' with deadline
      const { error: acceptErr } = await supabase
        .from("adoptions")
        .update({
          status: "accepted",
          responded_by_deadline: deadlineDate,
          updated_at: now.toISOString(),
        })
        .eq("id", adoption_id);

      if (acceptErr) {
        return NextResponse.json({ error: acceptErr.message }, { status: 500 });
      }

      // 2. Set all other PENDING adoptions for this project to 'superseded'
      const { data: pendingAdoptions } = await supabase
        .from("adoptions")
        .select("id, adopter_id")
        .eq("project_id", projectId)
        .eq("status", "pending")
        .neq("id", adoption_id);

      if (pendingAdoptions && pendingAdoptions.length > 0) {
        const supersededIds = pendingAdoptions.map((a: any) => a.id);
        await supabase
          .from("adoptions")
          .update({
            status: "superseded",
            updated_at: now.toISOString(),
          })
          .in("id", supersededIds);

        // 3. Notify each superseded adopter
        const supersededNotifs = pendingAdoptions.map((a: any) => ({
          user_id: a.adopter_id,
          type: "adoption_superseded",
          title: "Adoption Request Superseded",
          body: `Another developer was selected to adopt "${projectTitle}".`,
          related_project_id: projectId,
          related_adoption_id: a.id,
        }));
        await supabase.from("notifications").insert(supersededNotifs);
      }

      // 4. Notify accepted adopter
      await supabase.from("notifications").insert({
        user_id: adoption.adopter_id,
        type: "adoption_status",
        title: "Adoption Request Accepted!",
        body: `Your request to adopt "${projectTitle}" was accepted. Please complete handoff by ${new Date(deadlineDate).toLocaleDateString()}.`,
        related_project_id: projectId,
        related_adoption_id: adoption_id,
      });

      return NextResponse.json({
        success: true,
        message: "Adoption request accepted and other pending applicants notified.",
        responded_by_deadline: deadlineDate,
      });
    }

    // ------------------------------------------------------------------------
    // ACTION: REJECT
    // ------------------------------------------------------------------------
    if (action === "reject") {
      const { error: rejectErr } = await supabase
        .from("adoptions")
        .update({
          status: "rejected",
          updated_at: now.toISOString(),
        })
        .eq("id", adoption_id);

      if (rejectErr) {
        return NextResponse.json({ error: rejectErr.message }, { status: 500 });
      }

      await supabase.from("notifications").insert({
        user_id: adoption.adopter_id,
        type: "adoption_status",
        title: "Adoption Request Declined",
        body: `Your request to adopt "${projectTitle}" was declined.`,
        related_project_id: projectId,
        related_adoption_id: adoption_id,
      });

      return NextResponse.json({
        success: true,
        message: "Adoption request declined.",
      });
    }

    // ------------------------------------------------------------------------
    // ACTION: COMPLETE (Handoff finished)
    // ------------------------------------------------------------------------
    if (action === "complete") {
      // Set adoption status = 'completed'
      const { error: compErr } = await supabase
        .from("adoptions")
        .update({
          status: "completed",
          updated_at: now.toISOString(),
        })
        .eq("id", adoption_id);

      if (compErr) {
        return NextResponse.json({ error: compErr.message }, { status: 500 });
      }

      // Mark project as no longer adoptable
      await supabase
        .from("projects")
        .update({ is_adoptable: false })
        .eq("id", projectId);

      // Notify adopter
      await supabase.from("notifications").insert({
        user_id: adoption.adopter_id,
        type: "adoption_status",
        title: "Adoption Completed!",
        body: `Congratulations! Project handoff for "${projectTitle}" is officially completed.`,
        related_project_id: projectId,
        related_adoption_id: adoption_id,
      });

      return NextResponse.json({
        success: true,
        message: "Adoption marked as completed and project closed.",
      });
    }

    // ------------------------------------------------------------------------
    // ACTION: ABANDON BY ADOPTER (Handoff failed / unresponsive)
    // ------------------------------------------------------------------------
    if (action === "abandon_by_adopter") {
      // 1. Set adoption status = 'abandoned_by_adopter'
      const { error: abanErr } = await supabase
        .from("adoptions")
        .update({
          status: "abandoned_by_adopter",
          updated_at: now.toISOString(),
        })
        .eq("id", adoption_id);

      if (abanErr) {
        return NextResponse.json({ error: abanErr.message }, { status: 500 });
      }

      // 2. Reopen project for adoption (is_adoptable = true)
      await supabase
        .from("projects")
        .update({ is_adoptable: true })
        .eq("id", projectId);

      // 3. Query all previously SUPERSEDED adoptions for this project
      const { data: supersededAdoptions } = await supabase
        .from("adoptions")
        .select("id, adopter_id")
        .eq("project_id", projectId)
        .eq("status", "superseded");

      if (supersededAdoptions && supersededAdoptions.length > 0) {
        const reopenNotifs = supersededAdoptions.map((a: any) => ({
          user_id: a.adopter_id,
          type: "adoption_reopened",
          title: "Project Open Again for Adoption",
          body: `"${projectTitle}" is open for adoption again after a previous handoff timed out or was marked abandoned. You can re-request now.`,
          related_project_id: projectId,
          related_adoption_id: a.id,
        }));
        await supabase.from("notifications").insert(reopenNotifs);
      }

      return NextResponse.json({
        success: true,
        message: "Project reopened for adoption and superseded applicants notified.",
      });
    }

    // ------------------------------------------------------------------------
    // ACTION: EXTEND DEADLINE
    // ------------------------------------------------------------------------
    if (action === "extend_deadline") {
      const extendDays = days && Number(days) > 0 ? Number(days) : 14;
      const currentDeadline = adoption.responded_by_deadline
        ? new Date(adoption.responded_by_deadline)
        : now;
      const newDeadline = new Date(
        Math.max(currentDeadline.getTime(), now.getTime()) + extendDays * 86400 * 1000
      ).toISOString();

      const { error: extErr } = await supabase
        .from("adoptions")
        .update({
          responded_by_deadline: newDeadline,
          updated_at: now.toISOString(),
        })
        .eq("id", adoption_id);

      if (extErr) {
        return NextResponse.json({ error: extErr.message }, { status: 500 });
      }

      await supabase.from("notifications").insert({
        user_id: adoption.adopter_id,
        type: "adoption_status",
        title: "Handoff Deadline Extended",
        body: `The handoff deadline for "${projectTitle}" has been extended to ${new Date(newDeadline).toLocaleDateString()}.`,
        related_project_id: projectId,
        related_adoption_id: adoption_id,
      });

      return NextResponse.json({
        success: true,
        message: "Handoff deadline extended successfully.",
        responded_by_deadline: newDeadline,
      });
    }

    return NextResponse.json({ error: "Unhandled resolution action." }, { status: 400 });
  } catch (err: any) {
    return captureApiError(err, request, { feature: "adoptions_resolve" });
  }
}

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sanitizeProject, type ViewerRole } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleQuery = searchParams.get("role"); // 'adopter' | 'owner'

    // Fetch adoptions where current user is adopter or project owner
    const { data, error } = await supabase
      .from("adoptions")
      .select("*, project:projects(*, users:users(id, username, avatar_url, full_name)), adopter:users!adoptions_adopter_id_fkey(id, username, avatar_url, full_name)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const filteredAdoptions = (data || []).filter((adoption: any) => {
      const isAdopter = adoption.adopter_id === user.id;
      const isOwner = adoption.project?.user_id === user.id;

      if (roleQuery === "adopter") return isAdopter;
      if (roleQuery === "owner") return isOwner;
      return isAdopter || isOwner;
    });

    const sanitizedAdoptions = filteredAdoptions.map((adoption: any) => {
      const isOwner = adoption.project?.user_id === user.id;
      const viewerRole: ViewerRole = isOwner ? "owner" : "adopter";

      let project = adoption.project;
      if (project) {
        project = {
          ...project,
          user: project.users ?? null,
        };
        // Role-aware sanitization: owner retains metadata, adopter sees scrubbed metadata if anonymous
        project = sanitizeProject(project, { viewerRole });
      }

      return {
        id: adoption.id,
        project_id: adoption.project_id,
        adopter_id: adoption.adopter_id,
        message: adoption.message,
        status: adoption.status,
        created_at: adoption.created_at,
        updated_at: adoption.updated_at,
        project,
        adopter: adoption.adopter ?? null,
      };
    });

    return NextResponse.json(sanitizedAdoptions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, message } = body;

    if (!project_id || !message || !message.trim()) {
      return NextResponse.json(
        { error: "Validation Error: project_id and message are required" },
        { status: 400 }
      );
    }

    // Verify project exists and is adoptable
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, is_adoptable, is_anonymous, user_id")
      .eq("id", project_id)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.is_adoptable) {
      return NextResponse.json({ error: "Project is not open for adoption" }, { status: 400 });
    }

    if (project.user_id === user.id) {
      return NextResponse.json({ error: "Cannot adopt your own project" }, { status: 400 });
    }

    // Insert adoption request
    const { data: adoption, error: insertError } = await supabase
      .from("adoptions")
      .insert({
        project_id,
        adopter_id: user.id,
        message: message.trim(),
        status: "pending",
      })
      .select("id, project_id, adopter_id, message, status, created_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Return sanitized adoption confirmation - MUST NOT leak project owner details
    return NextResponse.json({
      success: true,
      adoption: {
        id: adoption.id,
        project_id: adoption.project_id,
        adopter_id: adoption.adopter_id,
        message: adoption.message,
        status: adoption.status,
        created_at: adoption.created_at,
      },
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      tagline,
      date_started,
      date_abandoned,
      time_invested_hours,
      stage_of_death,
      primary_reason,
      github_url,
      demo_url,
      what_it_was,
      why_abandoned,
      what_worked,
      what_failed,
      lessons_learned,
      what_id_do_differently,
      the_moment_i_knew,
      is_adoptable,
      is_anonymous,
      tags
    } = body;

    // Server-side validation
    const finalStage = stage_of_death || body.stage;
    const finalReason = primary_reason || body.cause_of_death || body.cause || body.primary_reason;

    if (!title || !finalStage || !finalReason) {
      return NextResponse.json(
        { error: "Validation Error: Missing required fields (title, stage_of_death, and primary_reason/cause_of_death are required)" },
        { status: 400 }
      );
    }

    // Prepare project data
    const projectData = {
      user_id: user.id,
      title,
      tagline: tagline || "",
      date_started: date_started || null,
      date_abandoned: date_abandoned || null,
      time_invested_hours: time_invested_hours ? parseInt(time_invested_hours, 10) : null,
      stage_of_death: finalStage,
      primary_reason: finalReason,
      github_url: github_url || body.repo_url || null,
      demo_url: demo_url || null,
      what_it_was: what_it_was || body.what_was_built || "",
      why_abandoned: why_abandoned || "",
      what_worked: what_worked || "",
      what_failed: what_failed || "",
      lessons_learned: lessons_learned || body.advice_for_others || "",
      what_id_do_differently: what_id_do_differently || body.would_do_differently || "",
      the_moment_i_knew: the_moment_i_knew || "",
      is_adoptable: is_adoptable !== undefined ? is_adoptable : true,
      is_anonymous: is_anonymous !== undefined ? is_anonymous : false,
    };

    // Insert project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert(projectData)
      .select("id")
      .single();

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    const projectId = project.id;

    // Handle tag mapping if present
    if (tags && Array.isArray(tags) && tags.length > 0) {
      try {
        const tagIds: string[] = [];

        // Check if tags elements are UUIDs or names
        const isUuid = (str: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

        const namesToQuery: string[] = [];
        for (const tag of tags) {
          if (isUuid(tag)) {
            tagIds.push(tag);
          } else {
            namesToQuery.push(tag);
          }
        }

        if (namesToQuery.length > 0) {
          const { data: dbTags } = await supabase
            .from("tags")
            .select("id, name")
            .in("name", namesToQuery);

          if (dbTags) {
            dbTags.forEach((t) => tagIds.push(t.id));
          }
        }

        // Insert into junction table
        if (tagIds.length > 0) {
          const projectTagsData = tagIds.map((tagId) => ({
            project_id: projectId,
            tag_id: tagId,
          }));

          await supabase.from("project_tags").insert(projectTagsData);
        }
      } catch (tagErr) {
        // SQL tags insertion is non-critical, catch and log
        console.error("Error inserting project tags:", tagErr);
      }
    }

    return NextResponse.json({ id: projectId }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

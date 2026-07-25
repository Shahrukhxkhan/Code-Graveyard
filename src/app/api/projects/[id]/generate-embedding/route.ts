import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    if (!projectId) {
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
    }

    const supabase = createServerClient();

    // 1. Fetch project post-mortem data
    const { data: project, error: fetchErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (fetchErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Prepare text blob for vector embedding
    const textParts = [
      `Title: ${project.title || ""}`,
      `Tagline: ${project.tagline || ""}`,
      `Why Abandoned: ${project.why_abandoned || ""}`,
      `Lessons Learned: ${project.lessons_learned || ""}`,
      `The Moment I Knew: ${project.the_moment_i_knew || ""}`,
      `What Worked: ${project.what_worked || ""}`,
      `What Failed: ${project.what_failed || ""}`,
      `What I'd Do Differently: ${project.what_id_do_differently || ""}`,
    ];

    const textToEmbed = textParts.filter(Boolean).join("\n\n").trim();

    if (!textToEmbed) {
      return NextResponse.json(
        { error: "No post-mortem text content available to embed" },
        { status: 400 }
      );
    }

    // 3. Call OpenAI Embedding API (text-embedding-3-small: 1536 dimensions)
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      console.warn("[Semantic Embedding] OPENAI_API_KEY is unconfigured. Skipping vector generation.");
      return NextResponse.json(
        { success: false, message: "OPENAI_API_KEY unconfigured; skipping embedding." },
        { status: 200 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: textToEmbed,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Semantic Embedding OpenAI API Error]:", errText);
      return NextResponse.json(
        { error: "Failed to generate embedding from OpenAI API." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const vector = data?.data?.[0]?.embedding;

    if (!vector || !Array.isArray(vector)) {
      return NextResponse.json(
        { error: "Invalid vector format returned from API." },
        { status: 500 }
      );
    }

    // 4. Update Projects table with embedding vector
    const { error: updateErr } = await supabase
      .from("projects")
      .update({ embedding: JSON.stringify(vector) })
      .eq("id", projectId);

    if (updateErr) {
      console.error("[Semantic Embedding DB Update Error]:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      dimensions: vector.length,
    });
  } catch (err: any) {
    console.error("[Semantic Embedding Exception]:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

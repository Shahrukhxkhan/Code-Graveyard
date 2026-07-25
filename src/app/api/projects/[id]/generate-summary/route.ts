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

    // 2. Check Rate Limit (1-hour cooldown for manual regeneration)
    const { searchParams } = new URL(request.url);
    const isManual = searchParams.get("manual") === "true";

    if (isManual && project.summary_generated_at) {
      const lastGenerated = new Date(project.summary_generated_at).getTime();
      const oneHourAgo = Date.now() - 3600 * 1000;

      if (lastGenerated > oneHourAgo) {
        return NextResponse.json(
          { error: "Summary was generated recently. Please wait 1 hour before regenerating." },
          { status: 429 }
        );
      }
    }

    // 3. Optional User Authorization check for manual triggers
    if (isManual) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== project.user_id) {
        return NextResponse.json(
          { error: "Forbidden: Only the project owner can regenerate the summary." },
          { status: 403 }
        );
      }
    }

    // 4. Call Anthropic API
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      // Fallback gracefully if API key is not configured
      console.warn("[AI Summary] ANTHROPIC_API_KEY is not configured. Falling back to tagline.");
      return NextResponse.json(
        { summary: null, fallback: true, message: "AI API key unconfigured; using tagline fallback." },
        { status: 200 }
      );
    }

    const systemPrompt =
      "You are a concise, candid developer post-mortem analyst. Summarize the given project post-mortem into a single punchy sentence (under 25 words) capturing the core lesson or reason for failure. Your tone must be candid, authentic, and developer-focused — NOT corporate or generic (e.g. 'Died from scope creep after 6 months chasing a rewrite' not 'The project experienced significant scope-related challenges'). NEVER mention personal names, emails, or identifying usernames.";

    const userPrompt = `
Title: ${project.title || "Untitled"}
Tagline: ${project.tagline || ""}
What it was: ${project.what_it_was || ""}
Why abandoned: ${project.why_abandoned || ""}
What worked: ${project.what_worked || ""}
What failed: ${project.what_failed || ""}
Lessons learned: ${project.lessons_learned || ""}
What I'd do differently: ${project.what_id_do_differently || ""}
The moment I knew: ${project.the_moment_i_knew || ""}
`.trim();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 100,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AI Summary Anthropic API Error]:", errText);
      // Graceful fallback: return 200 with summary null
      return NextResponse.json(
        { summary: null, fallback: true, message: "Anthropic API request failed; using tagline fallback." },
        { status: 200 }
      );
    }

    const data = await response.json();
    let generatedSummary = data?.content?.[0]?.text?.trim() || null;

    if (generatedSummary) {
      // Strip surrounding quotes if model added them
      generatedSummary = generatedSummary.replace(/^["']|["']$/g, "").trim();
    }

    if (!generatedSummary) {
      return NextResponse.json(
        { summary: null, fallback: true, message: "Empty summary returned; using tagline fallback." },
        { status: 200 }
      );
    }

    const now = new Date().toISOString();

    // 5. Update Database Record
    const { error: updateErr } = await supabase
      .from("projects")
      .update({
        summary: generatedSummary,
        summary_generated_at: now,
      })
      .eq("id", projectId);

    if (updateErr) {
      console.error("[AI Summary DB Update Error]:", updateErr.message);
    }

    return NextResponse.json({
      success: true,
      summary: generatedSummary,
      summary_generated_at: now,
    });
  } catch (err: any) {
    console.error("[AI Summary Exception]:", err);
    // Graceful fallback on exception
    return NextResponse.json(
      { summary: null, fallback: true, message: err.message || "Unexpected failure" },
      { status: 200 }
    );
  }
}

import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { MOCK_PROJECTS, MOCK_SNIPPETS } from "@/lib/mock-data";
import { ProjectDetailClient } from "@/components/projects/ProjectDetailClient";
import type { ProjectDisplay, SnippetDisplay } from "@/components/projects/ProjectDetailClient";
import { sanitizeProject } from "@/lib/utils";

async function fetchProjectData(
  id: string,
): Promise<{ project: ProjectDisplay; snippets: SnippetDisplay[] } | null> {
  try {
    const supabase = createServerClient();

    const { data } = await supabase
      .from("projects")
      .select(
        "*, users:users(id, username, avatar_url, full_name), project_tags(tag:tags(*))",
      )
      .eq("id", id)
      .maybeSingle();

    if (data) {
      if (data.is_hidden) {
        return null;
      }

      const tags = (data.project_tags ?? [])
        .map((pt: any) => pt.tag)
        .filter(Boolean);

      const project: ProjectDisplay = sanitizeProject({
        ...data,
        user: data.users ?? null,
        tags,
      });

      const { data: snippetsData } = await supabase
        .from("snippets")
        .select("*")
        .eq("project_id", id)
        .eq("is_hidden", false);

      return {
        project,
        snippets: (snippetsData ?? []) as SnippetDisplay[],
      };
    }
  } catch {
    // Supabase not configured or query failed — fall through to mock data
  }

  // ── Mock data fallback ────────────────────────────────────────────────────
  const mockProject = MOCK_PROJECTS.find((p) => p.id === id);
  if (!mockProject) return null;

  const mockSnippets = MOCK_SNIPPETS.filter((s) => s.project_id === id);

  return {
    project: sanitizeProject(mockProject as unknown as ProjectDisplay),
    snippets: mockSnippets as unknown as SnippetDisplay[],
  };
}

export default async function ProjectDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await fetchProjectData(params.id);

  if (!result) notFound();

  return (
    <ProjectDetailClient project={result.project} snippets={result.snippets} />
  );
}

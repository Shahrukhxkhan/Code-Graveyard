import Link from "next/link";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { Button } from "@/components/ui/button";
import { MOCK_PROJECTS, MOCK_STATS } from "@/lib/mock-data";
import { createServerClient } from "@/lib/supabase/server";
import type { ProjectWithRelations } from "@/types";

async function fetchCounts() {
  try {
    const supabase = createServerClient();
    const projectsRes = await supabase.from("projects").select("id", { count: "exact", head: true });
    const snippetsRes = await supabase.from("snippets").select("id", { count: "exact", head: true });
    const adoptionsRes = await supabase.from("adoptions").select("id", { count: "exact", head: true });

    return {
      total_projects: projectsRes.count ?? MOCK_STATS.total_projects,
      total_snippets: snippetsRes.count ?? MOCK_STATS.total_snippets,
      total_adoptions: adoptionsRes.count ?? MOCK_STATS.total_adoptions,
    };
  } catch (e) {
    return MOCK_STATS;
  }
}

interface FetchFilters {
  q?: string;
  stage?: string;
  cause?: string;
  adoptable?: boolean;
}

async function fetchProjects(filters: FetchFilters): Promise<ProjectWithRelations[]> {
  try {
    const supabase = createServerClient();
    let query = supabase
      .from("projects")
      .select("*, users:users(id, username, avatar_url), project_tags(tag:tags(*))");

    if (filters.q) {
      query = query.or(`title.ilike.%${filters.q}%,tagline.ilike.%${filters.q}%`);
    }
    if (filters.stage && filters.stage !== "all") {
      query = query.eq("stage_of_death", filters.stage);
    }
    if (filters.cause && filters.cause !== "all") {
      query = query.eq("primary_reason", filters.cause);
    }
    if (filters.adoptable) {
      query = query.eq("is_adoptable", true);
    }

    const { data } = await query
      .order("created_at", { ascending: false })
      .limit(12);

    if (!data) return MOCK_PROJECTS as unknown as ProjectWithRelations[];

    // Normalize results into ProjectWithRelations shape
    const projects = data.map((p: any) => {
      const tags = (p.project_tags ?? []).map((pt: any) => pt.tag).filter(Boolean);
      return {
        ...p,
        user: p.users ?? null,
        tags,
      } as ProjectWithRelations;
    });

    return projects;
  } catch (e) {
    // Fall back to mock data, applying filters in-memory
    let filtered = MOCK_PROJECTS;
    
    if (filters.q) {
      const qLower = filters.q.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(qLower) ||
          p.tagline.toLowerCase().includes(qLower)
      );
    }
    if (filters.stage && filters.stage !== "all") {
      filtered = filtered.filter((p) => p.stage_of_death === filters.stage);
    }
    if (filters.cause && filters.cause !== "all") {
      filtered = filtered.filter((p) => p.primary_reason === filters.cause);
    }
    if (filters.adoptable) {
      filtered = filtered.filter((p) => p.is_adoptable === true);
    }

    return filtered as unknown as ProjectWithRelations[];
  }
}

export default async function HomePage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const params = searchParams ?? {};
  const stats = await fetchCounts();

  // Apply server-side filtering based on search params
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const stage = typeof params.stage === "string" ? params.stage : "";
  const cause = typeof params.cause === "string" ? params.cause : (typeof params.reason === "string" ? params.reason : "");
  const adoptable = params.adoptable === "true" || params.adoptable === "1";
  const tags = typeof params.tags === "string" ? params.tags.split(",").map((t) => t.toLowerCase()) : [];

  let projects = await fetchProjects({ q, stage, cause, adoptable });

  if (tags.length) {
    projects = projects.filter((p) => {
      const lowerTags = (p.tags ?? []).map((t) => t.name.toLowerCase());
      return tags.every((tg) => lowerTags.includes(tg));
    });
  }

  return (
    <div className="w-full space-y-16 pb-8">
      <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 px-6 py-16 text-center sm:px-10">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex rounded-full border border-violet-500/40 bg-violet-600/20 px-3 py-1 text-xs font-medium text-violet-300">
            🪦 The Developer&apos;s Post-Mortem Platform
          </span>
          <h1 className="mt-6 text-4xl font-bold text-white md:text-6xl">
            Where Code Goes
            <span className="block bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
              to Die
            </span>
          </h1>
          <p className="mt-4 text-zinc-400">
            Post-mortems, abandoned projects, and salvageable code from developers who
            tried, learned, and moved on.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-violet-600 text-white hover:bg-violet-500">
              <a href="#graveyard">Browse the Graveyard</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-900"
            >
              <Link href="/project/new">Bury a Project</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:divide-x sm:divide-zinc-800">
            <div className="px-6">
              <p className="text-2xl font-bold text-white">{stats.total_projects}</p>
              <p className="text-sm text-zinc-400">Projects Buried</p>
            </div>
            <div className="px-6">
              <p className="text-2xl font-bold text-white">{stats.total_snippets}</p>
              <p className="text-sm text-zinc-400">Snippets Salvaged</p>
            </div>
            <div className="px-6">
              <p className="text-2xl font-bold text-white">{stats.total_adoptions}</p>
              <p className="text-sm text-zinc-400">Projects Adopted</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Recently Buried</h2>
          <Link href="/" className="text-sm text-violet-400 hover:text-violet-300">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.slice(0, 3).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section id="graveyard">
        <h2 className="mb-6 text-2xl font-semibold text-white">Browse the Graveyard</h2>
        <ProjectFilters />
        <ProjectGrid projects={projects} />
      </section>

      <section className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-zinc-900 to-violet-950/30 px-6 py-12 text-center">
        <h3 className="text-2xl font-semibold text-white">
          Have a project collecting digital dust?
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
          Give it a proper burial. Your failure might be someone else&apos;s lesson.
        </p>
        <Button asChild className="mt-6 bg-violet-600 text-white hover:bg-violet-500">
          <Link href="/project/new">Bury Your First Project</Link>
        </Button>
      </section>
    </div>
  );
}

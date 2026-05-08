import Link from "next/link";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { Button } from "@/components/ui/button";
import { MOCK_PROJECTS, MOCK_STATS } from "@/lib/mock-data";

export default function HomePage() {
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
              <p className="text-2xl font-bold text-white">{MOCK_STATS.total_projects}</p>
              <p className="text-sm text-zinc-400">Projects Buried</p>
            </div>
            <div className="px-6">
              <p className="text-2xl font-bold text-white">{MOCK_STATS.total_snippets}</p>
              <p className="text-sm text-zinc-400">Snippets Salvaged</p>
            </div>
            <div className="px-6">
              <p className="text-2xl font-bold text-white">{MOCK_STATS.total_adoptions}</p>
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
          {MOCK_PROJECTS.slice(0, 3).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section id="graveyard">
        <h2 className="mb-6 text-2xl font-semibold text-white">Browse the Graveyard</h2>
        <ProjectFilters />
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {MOCK_PROJECTS.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
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

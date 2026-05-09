import { ProjectCard } from "./ProjectCard";
import EmptyState from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { ProjectWithRelations } from "@/types";

export function ProjectGrid({
  projects,
  loading = false,
  emptyMessage = "No projects found.",
}: {
  projects: ProjectWithRelations[];
  loading?: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="py-8">
        <EmptyState icon="🪦" title="No graves yet" description={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}

export default ProjectGrid;


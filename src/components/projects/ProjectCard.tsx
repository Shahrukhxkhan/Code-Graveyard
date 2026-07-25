"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Eye, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReportModal } from "@/components/shared/ReportModal";
import type { ProjectWithRelations } from "@/types";
import { cn } from "@/lib/utils";

const stageStyles: Record<string, string> = {
  idea: "bg-zinc-700 text-zinc-100",
  prototype: "bg-yellow-600/20 text-yellow-300 border border-yellow-500/40",
  mvp: "bg-blue-600/20 text-blue-300 border border-blue-500/40",
  launched: "bg-green-600/20 text-green-300 border border-green-500/40",
  unknown: "bg-zinc-800 text-zinc-400",
};

const reasonLabel: Record<string, string> = {
  lost_interest: "Lost Interest",
  scope_creep: "Scope Creep",
  technical_debt: "Technical Debt",
  no_time: "No Time",
  market_timing: "Market Timing",
  team_issues: "Team Issues",
  financial: "Financial",
  technical_blocker: "Technical Blocker",
  pivoted: "Pivoted",
  other: "Other",
};

export function ProjectCard({ project }: { project: ProjectWithRelations }) {
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <>
      <Link
        href={`/project/${project.id}`}
        className="graveyard-card block cursor-pointer p-5 transition duration-200 hover:scale-[1.01]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <Badge className={cn("stage-badge", project.stage_of_death ? stageStyles[project.stage_of_death] : "bg-zinc-800 text-zinc-400")}>
            {project.stage_of_death ?? "unknown"}
          </Badge>
          <div className="flex items-center gap-2">
            <Badge className="border border-red-500/30 bg-red-600/20 text-red-300">
              {project.primary_reason ? (reasonLabel[project.primary_reason] ?? project.primary_reason) : "Other"}
            </Badge>
            <button
              type="button"
              title="Report Project"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsReportOpen(true);
              }}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white">{project.title}</h3>
        {project.summary ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-zinc-300 italic border-l-2 border-violet-500/60 pl-2">
            ✨ &quot;{project.summary}&quot;
          </p>
        ) : (
          <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{project.tagline}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span>⏱ {project.time_invested_hours ?? 0} hours invested</span>
          <span>
            📅 Abandoned {project.date_abandoned ? formatDistanceToNow(parseISO(project.date_abandoned), { addSuffix: true }) : "—"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(project.tags ?? []).slice(0, 3).map((tag) => (
            <span
              key={tag.name}
              className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-300"
            >
              {tag.name}
            </span>
          ))}
          {((project.tags ?? []).length > 3) ? (
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
              +{(project.tags ?? []).length - 3} more
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between">
          {project.is_anonymous ? (
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <span>👤</span>
              <span>Anonymous</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-zinc-700">
                <AvatarImage src={project.user?.avatar_url ?? undefined} alt={project.user?.username ?? "user"} />
                <AvatarFallback>{(project.user?.username ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-zinc-300">@{project.user?.username ?? "unknown"}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-zinc-400">
              <Eye className="h-3.5 w-3.5" />
              {project.view_count}
            </span>
            {project.is_adoptable ? (
              <span className="rounded-full bg-green-600/20 px-2 py-1 text-green-400">Adopt</span>
            ) : null}
          </div>
        </div>
      </Link>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="project"
        targetId={project.id}
        targetTitle={project.title}
      />
    </>
  );
}


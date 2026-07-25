"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type SimilarProject = {
  id: string;
  title: string;
  tagline: string;
  stage_of_death?: string | null;
  primary_reason?: string | null;
  summary?: string | null;
  shared_tag_names?: string[];
  combined_score?: number;
};

interface Props {
  projectId: string;
}

export function SimilarProjects({ projectId }: Props) {
  const [similarProjects, setSimilarProjects] = useState<SimilarProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchSimilar() {
      try {
        setLoading(true);
        const res = await fetch(`/api/projects/${projectId}/similar`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setSimilarProjects(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch similar projects:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchSimilar();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="mt-12 border-t border-zinc-800/80 pt-8">
        <h2 className="text-xl font-bold text-white mb-4">🪦 Similar Projects</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-zinc-900/60 animate-pulse border border-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  if (similarProjects.length === 0) {
    return (
      <div className="mt-12 border-t border-zinc-800/80 pt-8">
        <h2 className="text-xl font-bold text-white mb-2">🪦 Similar Projects</h2>
        <p className="text-sm text-zinc-500 italic">
          No similar projects buried yet — check back as the graveyard grows!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-zinc-800/80 pt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">🪦 Similar Projects</h2>
        <span className="text-xs text-zinc-500">Ranked by tag & narrative similarity</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {similarProjects.map((p) => {
          const sharedTag = p.shared_tag_names?.[0];

          return (
            <Link
              key={p.id}
              href={`/project/${p.id}`}
              className="group flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all duration-200 hover:border-violet-500/50 hover:bg-zinc-850"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  {p.stage_of_death && (
                    <Badge className="bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
                      {p.stage_of_death}
                    </Badge>
                  )}
                  {sharedTag ? (
                    <span className="text-[10px] font-medium text-violet-400 border border-violet-500/30 rounded px-1.5 py-0.5 bg-violet-950/40 truncate">
                      ✨ Tag: {sharedTag}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-zinc-400 border border-zinc-700/50 rounded px-1.5 py-0.5 bg-zinc-950/40">
                      ✨ Narrative Match
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                  {p.title}
                </h3>

                <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                  {p.summary ? `"${p.summary}"` : p.tagline}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/60">
                <span>View project →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

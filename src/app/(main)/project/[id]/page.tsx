"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Copy, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { MOCK_PROJECTS, MOCK_SNIPPETS } from "@/lib/mock-data";

const borderClasses = [
  "border-l-violet-500",
  "border-l-red-500",
  "border-l-green-500",
  "border-l-orange-500",
  "border-l-zinc-500",
  "border-l-blue-500",
  "border-l-teal-500",
];

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const project = useMemo(
    () => MOCK_PROJECTS.find((item) => item.id === params.id),
    [params.id],
  );

  if (!project) {
    router.replace("/");
    return null;
  }

  const snippets = MOCK_SNIPPETS.filter((snippet) => snippet.project_id === project.id);

  const sections = [
    { label: "WHAT IT WAS", icon: "💡", title: "What It Was", content: project.what_it_was },
    { label: "CAUSE OF DEATH", icon: "⚰️", title: "Cause of Death", content: project.why_abandoned },
    { label: "WHAT WORKED", icon: "✅", title: "What Worked", content: project.what_worked },
    { label: "WHAT FAILED", icon: "❌", title: "What Failed", content: project.what_failed },
    {
      label: "THE MOMENT I KNEW",
      icon: "💀",
      title: "The Moment I Knew",
      content: project.the_moment_i_knew,
    },
    {
      label: "LESSONS LEARNED",
      icon: "📚",
      title: "Lessons Learned",
      content: project.lessons_learned,
    },
    {
      label: "WHAT I'D DO DIFFERENTLY",
      icon: "🔄",
      title: "What I'd Do Differently",
      content: project.what_id_do_differently,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <Button
        variant="ghost"
        className="px-0 text-zinc-300 hover:bg-transparent hover:text-white"
        onClick={() => router.push("/")}
      >
        ← Back to Graveyard
      </Button>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-zinc-700 text-zinc-100">{project.stage_of_death}</Badge>
          <Badge className="bg-red-600/20 text-red-300">{project.primary_reason}</Badge>
        </div>
        <h1 className="text-3xl font-bold text-white">{project.title}</h1>
        <p className="text-xl text-zinc-400">{project.tagline}</p>
        <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
          <span>⏱ {project.time_invested_hours} hours</span>
          <span>📅 Started {format(parseISO(project.date_started), "MMM d, yyyy")}</span>
          <span>☠️ Abandoned {format(parseISO(project.date_abandoned), "MMM d, yyyy")}</span>
          <span>👁 {project.view_count} views</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          {project.is_anonymous ? (
            <p className="text-sm text-zinc-400">Buried anonymously</p>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={project.user.avatar_url} alt={project.user.username} />
                <AvatarFallback>{project.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-zinc-400">
                Buried by @{project.user.username} on{" "}
                {formatDistanceToNow(parseISO(project.date_abandoned), { addSuffix: true })}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="border-zinc-700 bg-zinc-900">
              🔖 Save
            </Button>
            <Button variant="outline" className="border-zinc-700 bg-zinc-900">
              🔗 Share
            </Button>
            {project.github_url ? (
              <Button asChild className="bg-zinc-800 hover:bg-zinc-700">
                <a href={project.github_url} target="_blank" rel="noreferrer">
                  View on GitHub <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      <div className="space-y-4">
        {sections.map((section, index) => (
          <section
            key={section.title}
            className={`post-mortem-section border-l-4 ${borderClasses[index]}`}
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">{section.label}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {section.icon} {section.title}
            </h3>
            <p className="mt-2 leading-relaxed text-zinc-300">{section.content}</p>
          </section>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Technologies & Tags</h2>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag.name}
              className="rounded-full border border-zinc-700 px-2.5 py-1 text-sm text-zinc-200"
            >
              {tag.name}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Salvageable Code</h2>
          <p className="text-sm text-zinc-400">Useful pieces worth rescuing</p>
        </div>
        {snippets.length === 0 ? (
          <EmptyState
            icon="🧩"
            title="No snippets left behind"
            description="This project has no salvageable snippets yet."
          />
        ) : (
          <div className="space-y-4">
            {snippets.map((snippet) => (
              <div key={snippet.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white">{snippet.title}</h3>
                    <p className="text-sm text-zinc-400">{snippet.description}</p>
                  </div>
                  <Badge className="bg-violet-600/20 text-violet-300">{snippet.language}</Badge>
                </div>
                <div className="relative mt-4">
                  <pre className="code-block">
                    <code>{snippet.code}</code>
                  </pre>
                  <button
                    className="absolute right-3 top-3 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800"
                    onClick={async () => {
                      await navigator.clipboard.writeText(snippet.code);
                      setCopiedId(snippet.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Copy className="h-3.5 w-3.5" />
                      {copiedId === snippet.id ? "Copied!" : "Copy"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {project.is_adoptable ? (
        <section className="rounded-xl border border-violet-500/40 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-white">This project is up for adoption</h2>
          <p className="mt-2 text-zinc-400">
            The original author has abandoned this project and is open to someone else
            taking it over.
          </p>
          <Textarea
            className="mt-4 border-zinc-700 bg-zinc-950"
            placeholder="Why do you want to adopt this project?"
          />
          <Button className="mt-4 bg-violet-600 text-white hover:bg-violet-500">
            Request Adoption
          </Button>
        </section>
      ) : null}
    </div>
  );
}

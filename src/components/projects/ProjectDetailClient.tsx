"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Bookmark, Copy, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

// Flexible display types — satisfied by both real DB rows and mock data.
type TagDisplay = { name: string };

type UserDisplay = {
  username: string;
  avatar_url?: string | null;
  full_name?: string | null;
};

export type SnippetDisplay = {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  is_standalone?: boolean | null;
  save_count?: number | null;
  project_id: string;
};

export type ProjectDisplay = {
  id: string;
  title: string;
  tagline: string;
  what_it_was: string;
  why_abandoned: string;
  what_worked: string;
  what_failed: string;
  the_moment_i_knew: string;
  lessons_learned: string;
  what_id_do_differently: string;
  stage_of_death?: string | null;
  primary_reason?: string | null;
  time_invested_hours?: number | null;
  date_started?: string | null;
  date_abandoned?: string | null;
  github_url?: string | null;
  is_adoptable?: boolean | null;
  is_anonymous?: boolean | null;
  view_count?: number | null;
  user?: UserDisplay | null;
  tags?: TagDisplay[];
};

interface Props {
  project: ProjectDisplay;
  snippets: SnippetDisplay[];
}

const borderClasses = [
  "border-l-violet-500",
  "border-l-red-500",
  "border-l-green-500",
  "border-l-orange-500",
  "border-l-zinc-500",
  "border-l-blue-500",
  "border-l-teal-500",
];

export function ProjectDetailClient({ project, snippets }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [adoptionMessage, setAdoptionMessage] = useState("");
  const [adoptionLoading, setAdoptionLoading] = useState(false);

  // ── Snippet copy ──────────────────────────────────────────────────────────
  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  // ── Share — copy current URL ───────────────────────────────────────────────
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard! 🔗");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  // ── Save project ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) {
      toast.error("Sign in to save projects.", {
        action: { label: "Sign in", onClick: () => router.push("/login") },
      });
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("saves")
        .insert({ user_id: user.id, project_id: project.id });

      if (error) {
        // 23505 = unique constraint violation → already saved
        if (error.code === "23505") {
          toast.info("Already saved to your graveyard.");
        } else {
          throw error;
        }
      } else {
        setSaved(true);
        toast.success("Project saved to your graveyard! 🪦");
      }
    } catch {
      toast.error("Could not save project. Please try again.");
    }
  };

  // ── Adoption request ──────────────────────────────────────────────────────
  const handleAdopt = async () => {
    if (!user) {
      toast.error("Sign in to request adoption.", {
        action: { label: "Sign in", onClick: () => router.push("/login") },
      });
      return;
    }

    if (!adoptionMessage.trim()) {
      toast.error("Please write a message explaining why you want to adopt this project.");
      return;
    }

    setAdoptionLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("adoptions").insert({
        project_id: project.id,
        adopter_id: user.id,
        message: adoptionMessage.trim(),
      });

      if (error) throw error;

      toast.success("Adoption request sent! 🎉 The author will be in touch.");
      setAdoptionMessage("");
    } catch {
      toast.error("Could not send adoption request. Please try again.");
    } finally {
      setAdoptionLoading(false);
    }
  };

  const sections = [
    { label: "WHAT IT WAS", icon: "💡", title: "What It Was", content: project.what_it_was },
    { label: "CAUSE OF DEATH", icon: "⚰️", title: "Cause of Death", content: project.why_abandoned },
    { label: "WHAT WORKED", icon: "✅", title: "What Worked", content: project.what_worked },
    { label: "WHAT FAILED", icon: "❌", title: "What Failed", content: project.what_failed },
    { label: "THE MOMENT I KNEW", icon: "💀", title: "The Moment I Knew", content: project.the_moment_i_knew },
    { label: "LESSONS LEARNED", icon: "📚", title: "Lessons Learned", content: project.lessons_learned },
    { label: "WHAT I'D DO DIFFERENTLY", icon: "🔄", title: "What I'd Do Differently", content: project.what_id_do_differently },
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

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {project.stage_of_death && (
            <Badge className="bg-zinc-700 text-zinc-100">{project.stage_of_death}</Badge>
          )}
          {project.primary_reason && (
            <Badge className="bg-red-600/20 text-red-300">{project.primary_reason}</Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold text-white">{project.title}</h1>
        <p className="text-xl text-zinc-400">{project.tagline}</p>

        <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
          {project.time_invested_hours != null && (
            <span>⏱ {project.time_invested_hours} hours</span>
          )}
          {project.date_started && (
            <span>📅 Started {format(parseISO(project.date_started), "MMM d, yyyy")}</span>
          )}
          {project.date_abandoned && (
            <span>☠️ Abandoned {format(parseISO(project.date_abandoned), "MMM d, yyyy")}</span>
          )}
          {project.view_count != null && <span>👁 {project.view_count} views</span>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Author */}
          {project.is_anonymous ? (
            <p className="text-sm text-zinc-400">Buried anonymously</p>
          ) : project.user ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={project.user.avatar_url ?? undefined}
                  alt={project.user.username}
                />
                <AvatarFallback>
                  {project.user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-zinc-400">
                Buried by{" "}
                <Link
                  href={`/profile/${project.user.username}`}
                  className="hover:text-white hover:underline"
                >
                  @{project.user.username}
                </Link>
                {project.date_abandoned && (
                  <>
                    {" "}
                    {formatDistanceToNow(parseISO(project.date_abandoned), {
                      addSuffix: true,
                    })}
                  </>
                )}
              </p>
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={`border-zinc-700 bg-zinc-900 transition-colors ${
                saved ? "border-violet-500 text-violet-300" : ""
              }`}
              onClick={handleSave}
            >
              <Bookmark
                className={`mr-1.5 h-4 w-4 ${saved ? "fill-violet-400 text-violet-400" : ""}`}
              />
              {saved ? "Saved" : "Save"}
            </Button>

            <Button
              variant="outline"
              className="border-zinc-700 bg-zinc-900"
              onClick={handleShare}
            >
              <Share2 className="mr-1.5 h-4 w-4" />
              Share
            </Button>

            {project.github_url && (
              <Button asChild className="bg-zinc-800 hover:bg-zinc-700">
                <a href={project.github_url} target="_blank" rel="noreferrer">
                  View on GitHub <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* ── Post-mortem sections ────────────────────────────────────────────── */}
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

      {/* ── Tags ────────────────────────────────────────────────────────────── */}
      {(project.tags ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Technologies &amp; Tags</h2>
          <div className="flex flex-wrap gap-2">
            {(project.tags ?? []).map((tag) => (
              <span
                key={tag.name}
                className="rounded-full border border-zinc-700 px-2.5 py-1 text-sm text-zinc-200"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Salvageable snippets ─────────────────────────────────────────────── */}
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
                    onClick={() => handleCopy(snippet.code, snippet.id)}
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

      {/* ── Adoption form ────────────────────────────────────────────────────── */}
      {project.is_adoptable && (
        <section className="rounded-xl border border-violet-500/40 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-white">This project is up for adoption</h2>
          <p className="mt-2 text-zinc-400">
            The original author has abandoned this project and is open to someone else taking it
            over.
          </p>
          <Textarea
            className="mt-4 border-zinc-700 bg-zinc-950"
            placeholder="Why do you want to adopt this project?"
            rows={4}
            value={adoptionMessage}
            onChange={(e) => setAdoptionMessage(e.target.value)}
          />
          <Button
            className="mt-4 bg-violet-600 text-white hover:bg-violet-500"
            onClick={handleAdopt}
            disabled={adoptionLoading}
          >
            {adoptionLoading ? "Sending…" : "Request Adoption"}
          </Button>
        </section>
      )}
    </div>
  );
}

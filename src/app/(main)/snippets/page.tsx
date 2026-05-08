"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_PROJECTS, MOCK_SNIPPETS } from "@/lib/mock-data";

function highlightCode(code: string) {
  const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .replace(
      /\b(const|let|return|if|else|function|export|import|async|await|type|interface|try|catch)\b/g,
      '<span class="text-violet-400">$1</span>',
    )
    .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-green-400">$1</span>');
}

export default function SnippetsPage() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [standaloneOnly, setStandaloneOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const languages = useMemo(
    () => Array.from(new Set(MOCK_SNIPPETS.map((snippet) => snippet.language))),
    [],
  );

  const filtered = useMemo(() => {
    return MOCK_SNIPPETS.filter((snippet) => {
      const matchesQuery =
        snippet.title.toLowerCase().includes(query.toLowerCase()) ||
        snippet.description.toLowerCase().includes(query.toLowerCase());
      const matchesLanguage = language === "all" || snippet.language === language;
      const matchesStandalone = !standaloneOnly || snippet.is_standalone;
      return matchesQuery && matchesLanguage && matchesStandalone;
    });
  }, [query, language, standaloneOnly]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Salvageable Code</h1>
        <p className="text-zinc-400">
          Useful pieces rescued from abandoned projects
        </p>
        <p className="text-sm text-zinc-500">
          {MOCK_SNIPPETS.length} snippets salvaged across {MOCK_PROJECTS.length} projects
        </p>
      </section>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-zinc-700 bg-zinc-950 pl-10"
              placeholder="Search snippets..."
            />
          </div>
          <Select value={language} onValueChange={(value) => setLanguage(value ?? "all")}>
            <SelectTrigger className="w-full border-zinc-700 bg-zinc-950 md:w-[220px]">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-900 text-white">
              <SelectItem value="all">All Languages</SelectItem>
              {languages.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setStandaloneOnly((prev) => !prev)}
            className={standaloneOnly ? "bg-violet-600 hover:bg-violet-500" : "bg-zinc-800 hover:bg-zinc-700"}
          >
            Standalone Only
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((snippet) => {
          const project = MOCK_PROJECTS.find((entry) => entry.id === snippet.project_id);
          return (
            <article key={snippet.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">{snippet.title}</h2>
                <div className="flex items-center gap-2">
                  <Badge className="bg-violet-600/20 text-violet-300">{snippet.language}</Badge>
                  {snippet.is_standalone ? (
                    <Badge className="bg-green-600/20 text-green-300">Standalone</Badge>
                  ) : null}
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{snippet.description}</p>
              <pre
                className="code-block mt-4"
                dangerouslySetInnerHTML={{ __html: highlightCode(snippet.code) }}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-400">
                <Link href={`/project/${snippet.project_id}`} className="hover:text-white">
                  From: {project?.title ?? "Unknown Project"}
                </Link>
                <div className="flex items-center gap-3">
                  <span>💾 {snippet.save_count} saves</span>
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
                    onClick={async () => {
                      await navigator.clipboard.writeText(snippet.code);
                      setCopiedId(snippet.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedId === snippet.id ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

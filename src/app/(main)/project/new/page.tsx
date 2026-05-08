"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const steps = ["The Basics", "The Post Mortem", "The Lessons", "Tag & Publish"];
const techTags = ["React", "Next.js", "Node.js", "Python", "TypeScript", "Vue", "PostgreSQL", "MongoDB"];
const domainTags = ["SaaS", "Mobile App", "CLI Tool", "API", "Browser Extension", "Game", "Developer Tool"];

export default function NewProjectPage() {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [openForAdoption, setOpenForAdoption] = useState(true);
  const [anonymous, setAnonymous] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [buried, setBuried] = useState(false);
  const [textFields, setTextFields] = useState<Record<string, string>>({});

  const heading = useMemo(() => steps[step - 1], [step]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  if (buried) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-20 text-center">
        <p className="text-6xl">⚰️</p>
        <h1 className="mt-4 text-3xl font-bold text-white">Project Buried.</h1>
        <p className="mt-2 text-zinc-400">Rest in peace, {projectName}.</p>
        <Button asChild className="mt-6 bg-violet-600 hover:bg-violet-500">
          <Link href="/project/1">View Your Project</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((label, index) => {
          const current = index + 1;
          const completed = current < step;
          const active = current === step;
          return (
            <div key={label} className="text-center">
              <div
                className={[
                  "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                  completed ? "bg-violet-600 text-white" : "",
                  active ? "border-2 border-violet-500 bg-zinc-900 text-white" : "",
                  !active && !completed ? "bg-zinc-700 text-zinc-300" : "",
                ].join(" ")}
              >
                {current}
              </div>
              <p className="mt-2 text-xs text-zinc-400">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-2xl font-bold text-white">{heading}</h1>

        {step === 1 ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-zinc-400">Let&apos;s start simple</p>
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="border-zinc-700 bg-zinc-950" />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input className="border-zinc-700 bg-zinc-950" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date Started</Label>
                <Input type="date" className="border-zinc-700 bg-zinc-950" />
              </div>
              <div className="space-y-2">
                <Label>Date Abandoned</Label>
                <Input type="date" className="border-zinc-700 bg-zinc-950" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hours Invested</Label>
              <Input type="number" className="border-zinc-700 bg-zinc-950" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Stage when abandoned</Label>
                <Select>
                  <SelectTrigger className="border-zinc-700 bg-zinc-950">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-900 text-white">
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="prototype">Prototype</SelectItem>
                    <SelectItem value="mvp">MVP</SelectItem>
                    <SelectItem value="launched">Launched</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary reason for abandonment</Label>
                <Select>
                  <SelectTrigger className="border-zinc-700 bg-zinc-950">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-900 text-white">
                    <SelectItem value="lost_interest">Lost Interest</SelectItem>
                    <SelectItem value="scope_creep">Scope Creep</SelectItem>
                    <SelectItem value="technical_debt">Technical Debt</SelectItem>
                    <SelectItem value="no_time">No Time</SelectItem>
                    <SelectItem value="market_timing">Market Timing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>GitHub URL (optional)</Label>
              <Input className="border-zinc-700 bg-zinc-950" />
            </div>
            <div className="space-y-2">
              <Label>Demo URL (optional)</Label>
              <Input className="border-zinc-700 bg-zinc-950" />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-5">
            <p className="text-sm text-zinc-400">Time to reflect. Be honest.</p>
            {[
              "What did you build?",
              "Why did you really walk away?",
              "What went surprisingly well?",
              "What went wrong?",
            ].map((prompt) => (
              <div key={prompt} className="space-y-2">
                <Label>{prompt}</Label>
                <Textarea
                  rows={4}
                  className="border-zinc-700 bg-zinc-950"
                  value={textFields[prompt] ?? ""}
                  onChange={(e) => setTextFields((prev) => ({ ...prev, [prompt]: e.target.value }))}
                />
                <p className="text-right text-xs text-zinc-500">{(textFields[prompt] ?? "").length} characters</p>
              </div>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 space-y-5">
            <p className="text-sm text-zinc-400">The part that makes this worth sharing.</p>
            {[
              ["When did you know it was over?", 3],
              ["What would you tell a developer starting this today?", 4],
              ["If you started over tomorrow...", 4],
            ].map(([prompt, rows]) => (
              <div key={prompt} className="space-y-2">
                <Label>{prompt}</Label>
                <Textarea rows={rows as number} className="border-zinc-700 bg-zinc-950" />
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div>
                <p className="font-medium text-white">Open for Adoption?</p>
                <p className="text-sm text-zinc-400">Allow others to request ownership of this project.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenForAdoption((prev) => !prev)}
                className={`relative h-7 w-12 rounded-full transition ${openForAdoption ? "bg-violet-600" : "bg-zinc-700"}`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${openForAdoption ? "left-6" : "left-1"}`}
                />
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-6 space-y-6">
            <p className="text-sm text-zinc-400">Help others find this.</p>
            <div>
              <h3 className="mb-3 font-medium text-white">Technology tags</h3>
              <div className="flex flex-wrap gap-2">
                {techTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1 text-sm ${selectedTags.includes(tag) ? "border-violet-500 bg-violet-600 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-300"}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-medium text-white">Domain tags</h3>
              <div className="flex flex-wrap gap-2">
                {domainTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1 text-sm ${selectedTags.includes(tag) ? "border-violet-500 bg-violet-600 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-300"}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div>
                <p className="font-medium text-white">Bury this anonymously</p>
                <p className="text-sm text-zinc-400">Hide your identity and publish as anonymous.</p>
              </div>
              <button
                type="button"
                onClick={() => setAnonymous((prev) => !prev)}
                className={`relative h-7 w-12 rounded-full transition ${anonymous ? "bg-violet-600" : "bg-zinc-700"}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${anonymous ? "left-6" : "left-1"}`} />
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={step === 1}
            className="border-zinc-700 bg-zinc-950"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          >
            Back
          </Button>
          {step < 4 ? (
            <Button className="bg-violet-600 hover:bg-violet-500" onClick={() => setStep((prev) => Math.min(4, prev + 1))}>
              Continue
            </Button>
          ) : (
            <Button className="bg-violet-600 px-6 py-6 text-base hover:bg-violet-500" onClick={() => setBuried(true)}>
              Bury This Project 🪦
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

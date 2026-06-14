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
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const steps = ["The Basics", "The Post Mortem", "The Lessons", "Tag & Publish"];
const techTags = ["React", "Next.js", "Node.js", "Python", "TypeScript", "Vue", "PostgreSQL", "MongoDB"];
const domainTags = ["SaaS", "Mobile App", "CLI Tool", "API", "Browser Extension", "Game", "Developer Tool"];

export default function NewProjectPage() {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("Untitled Project");
  const [tagline, setTagline] = useState("");
  const [dateStarted, setDateStarted] = useState("");
  const [dateAbandoned, setDateAbandoned] = useState("");
  const [hoursInvested, setHoursInvested] = useState("");
  const [stage, setStage] = useState("idea");
  const [reason, setReason] = useState("lost_interest");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [openForAdoption, setOpenForAdoption] = useState(true);
  const [anonymous, setAnonymous] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [buried, setBuried] = useState(false);
  const [textFields, setTextFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const router = useRouter();
  const heading = useMemo(() => steps[step - 1], [step]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        title: projectName,
        tagline: tagline,
        date_started: dateStarted || null,
        date_abandoned: dateAbandoned || null,
        time_invested_hours: hoursInvested ? parseInt(hoursInvested, 10) : null,
        stage_of_death: stage,
        primary_reason: reason,
        github_url: githubUrl || null,
        demo_url: demoUrl || null,
        what_it_was: textFields["What did you build?"] || "",
        why_abandoned: textFields["Why did you really walk away?"] || "",
        what_worked: textFields["What went surprisingly well?"] || "",
        what_failed: textFields["What went wrong?"] || "",
        the_moment_i_knew: textFields["When did you know it was over?"] || "",
        lessons_learned: textFields["What would you tell a developer starting this today?"] || "",
        what_id_do_differently: textFields["If you started over tomorrow..."] || "",
        is_adoptable: openForAdoption,
        is_anonymous: anonymous,
        tags: selectedTags,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setCreatedProjectId(data.id);
      setBuried(true);
      toast.success("Project buried successfully! 🪦");

      setTimeout(() => {
        router.push(`/project/${data.id}`);
      }, 2500);

    } catch (err: any) {
      toast.error(err.message || "Failed to bury project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (buried) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-20 text-center">
        <p className="text-6xl">⚰️</p>
        <h1 className="mt-4 text-3xl font-bold text-white">Project Buried.</h1>
        <p className="mt-2 text-zinc-400">Rest in peace, {projectName}.</p>
        <Button asChild className="mt-6 bg-violet-600 hover:bg-violet-500">
          <Link href={`/project/${createdProjectId || "1"}`}>View Your Project</Link>
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
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="border-zinc-700 bg-zinc-950" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date Started</Label>
                <Input type="date" value={dateStarted} onChange={(e) => setDateStarted(e.target.value)} className="border-zinc-700 bg-zinc-950" />
              </div>
              <div className="space-y-2">
                <Label>Date Abandoned</Label>
                <Input type="date" value={dateAbandoned} onChange={(e) => setDateAbandoned(e.target.value)} className="border-zinc-700 bg-zinc-950" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hours Invested</Label>
              <Input type="number" value={hoursInvested} onChange={(e) => setHoursInvested(e.target.value)} className="border-zinc-700 bg-zinc-950" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Stage when abandoned</Label>
                <Select value={stage} onValueChange={setStage}>
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
                <Select value={reason} onValueChange={setReason}>
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
              <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="border-zinc-700 bg-zinc-950" />
            </div>
            <div className="space-y-2">
              <Label>Demo URL (optional)</Label>
              <Input value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} className="border-zinc-700 bg-zinc-950" />
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
              <div key={prompt as string} className="space-y-2">
                <Label>{prompt as string}</Label>
                <Textarea
                  rows={rows as number}
                  className="border-zinc-700 bg-zinc-950"
                  value={textFields[prompt as string] ?? ""}
                  onChange={(e) => setTextFields((prev) => ({ ...prev, [prompt as string]: e.target.value }))}
                />
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
            <Button 
              className="bg-violet-600 px-6 py-6 text-base hover:bg-violet-500" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Burying... 🪦" : "Bury This Project 🪦"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

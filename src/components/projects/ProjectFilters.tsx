"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProjectFilters() {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const [reason, setReason] = useState("all");
  const [adoptableOnly, setAdoptableOnly] = useState(false);

  const hasFilters = useMemo(() => {
    return query.length > 0 || stage !== "all" || reason !== "all" || adoptableOnly;
  }, [query, stage, reason, adoptableOnly]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the graveyard..."
            className="border-zinc-700 bg-zinc-950 pl-10 text-white placeholder:text-zinc-500"
          />
        </div>

        <Select value={stage} onValueChange={(value) => setStage(value ?? "all")}>
          <SelectTrigger className="w-full border-zinc-700 bg-zinc-950 lg:w-[190px]">
            <SelectValue placeholder="Stage of Death" />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-900 text-white">
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="prototype">Prototype</SelectItem>
            <SelectItem value="mvp">MVP</SelectItem>
            <SelectItem value="launched">Launched</SelectItem>
          </SelectContent>
        </Select>

        <Select value={reason} onValueChange={(value) => setReason(value ?? "all")}>
          <SelectTrigger className="w-full border-zinc-700 bg-zinc-950 lg:w-[220px]">
            <SelectValue placeholder="Cause of Death" />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-900 text-white">
            <SelectItem value="all">All Causes</SelectItem>
            <SelectItem value="lost_interest">Lost Interest</SelectItem>
            <SelectItem value="scope_creep">Scope Creep</SelectItem>
            <SelectItem value="technical_debt">Technical Debt</SelectItem>
            <SelectItem value="no_time">No Time</SelectItem>
            <SelectItem value="market_timing">Market Timing</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          onClick={() => setAdoptableOnly((prev) => !prev)}
          className={adoptableOnly ? "bg-violet-600 hover:bg-violet-500" : "bg-zinc-800 hover:bg-zinc-700"}
        >
          Adoptable Only
        </Button>

        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
            onClick={() => {
              setQuery("");
              setStage("all");
              setReason("all");
              setAdoptableOnly(false);
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}

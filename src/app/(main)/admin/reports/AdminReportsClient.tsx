"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { AlertCircle, CheckCircle2, EyeOff, Flag, Loader2, ShieldX, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import type { ReportWithTarget } from "@/types";

export function AdminReportsClient() {
  const [reports, setReports] = useState<ReportWithTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"pending" | "actioned" | "dismissed" | "all">("pending");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/reports");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load moderation reports");
      }

      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message || "Failed to load moderation queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportId: string, action: "action" | "dismiss") => {
    try {
      setActioningId(reportId);
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update report");
        return;
      }

      toast.success(data.message || "Report updated successfully");
      
      // Update local state
      setReports((prev) =>
        prev.map((r) => {
          if (r.id === reportId) {
            const updated = {
              ...r,
              status: action === "action" ? ("actioned" as const) : ("dismissed" as const),
              reviewed_at: new Date().toISOString(),
            };
            if (action === "action") {
              if (updated.project_target) updated.project_target.is_hidden = true;
              if (updated.snippet_target) updated.snippet_target.is_hidden = true;
            }
            return updated;
          }
          return r;
        })
      );
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setActioningId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const counts = {
    pending: reports.filter((r) => r.status === "pending").length,
    actioned: reports.filter((r) => r.status === "actioned").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
    all: reports.length,
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center space-x-2 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        <span>Loading moderation queue...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-6 text-center text-red-300">
        <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-2 font-medium">{error}</p>
        <Button onClick={fetchReports} className="mt-4 bg-zinc-800 hover:bg-zinc-700">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5">
        {(["pending", "actioned", "dismissed", "all"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filterStatus === status
                ? "bg-violet-600 text-white shadow"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <span className="capitalize">{status}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                filterStatus === status ? "bg-violet-500/40 text-white" : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <EmptyState
          icon="🛡️"
          title={`No ${filterStatus} reports`}
          description={
            filterStatus === "pending"
              ? "All reported content has been reviewed! Safe sailing."
              : `There are currently no reports with status "${filterStatus}".`
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isTargetHidden = report.project_target?.is_hidden || report.snippet_target?.is_hidden;

            return (
              <div
                key={report.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        report.target_type === "project"
                          ? "bg-blue-600/20 text-blue-300 border border-blue-500/40"
                          : "bg-purple-600/20 text-purple-300 border border-purple-500/40"
                      }
                    >
                      {report.target_type.toUpperCase()}
                    </Badge>
                    <Badge className="border border-red-500/30 bg-red-600/20 text-red-300">
                      Reason: {report.reason}
                    </Badge>
                    {isTargetHidden && (
                      <Badge className="bg-amber-600/20 text-amber-300 border border-amber-500/40">
                        <EyeOff className="mr-1 h-3 w-3 inline" /> Hidden
                      </Badge>
                    )}
                    <Badge
                      className={
                        report.status === "pending"
                          ? "bg-zinc-800 text-yellow-300"
                          : report.status === "actioned"
                          ? "bg-red-600/20 text-red-300"
                          : "bg-zinc-800 text-zinc-400"
                      }
                    >
                      Status: {report.status}
                    </Badge>
                  </div>

                  <span className="text-xs text-zinc-400">
                    Reported {formatDistanceToNow(parseISO(report.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Content Preview */}
                <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                    Reported Content Preview
                  </div>
                  {report.project_target ? (
                    <div>
                      <Link
                        href={`/project/${report.project_target.id}`}
                        className="text-base font-bold text-white hover:underline"
                      >
                        {report.project_target.title}
                      </Link>
                      <p className="mt-1 text-sm text-zinc-400">{report.project_target.tagline}</p>
                    </div>
                  ) : report.snippet_target ? (
                    <div>
                      <h4 className="text-base font-bold text-white">{report.snippet_target.title}</h4>
                      {report.snippet_target.description && (
                        <p className="mt-1 text-sm text-zinc-400">{report.snippet_target.description}</p>
                      )}
                      {report.snippet_target.code && (
                        <pre className="mt-2 rounded bg-zinc-900 p-2.5 text-xs text-zinc-300 overflow-x-auto max-h-32">
                          <code>{report.snippet_target.code}</code>
                        </pre>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm italic text-zinc-500">
                      [Target content unavailable or deleted (ID: {report.target_id})]
                    </p>
                  )}
                </div>

                {/* Details & Reporter Info */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5 border border-zinc-700">
                      <AvatarImage src={report.reporter?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      Reporter: <strong className="text-zinc-300">@{report.reporter?.username || "unknown"}</strong>
                    </span>
                  </div>

                  {report.details && (
                    <div className="w-full text-sm text-zinc-300 bg-zinc-950/60 p-2.5 rounded border border-zinc-800/80">
                      <span className="font-semibold text-zinc-400">Reporter Details:</span> &quot;{report.details}&quot;
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-4">
                  <div className="text-xs text-zinc-400">
                    {report.reviewed_at && (
                      <span>
                        Reviewed {formatDistanceToNow(parseISO(report.reviewed_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actioningId === report.id || report.status === "dismissed"}
                      onClick={() => handleAction(report.id, "dismiss")}
                      className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                    >
                      {actioningId === report.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldX className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Dismiss
                    </Button>

                    <Button
                      size="sm"
                      disabled={actioningId === report.id || report.status === "actioned"}
                      onClick={() => handleAction(report.id, "action")}
                      className="bg-red-600 text-white hover:bg-red-500 font-semibold"
                    >
                      {actioningId === report.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Take Action (Hide)
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

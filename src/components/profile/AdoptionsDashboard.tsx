"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import type { AdoptionWithRelations } from "@/types";

export function AdoptionsDashboard() {
  const { user } = useAuth();
  const [adoptions, setAdoptions] = useState<AdoptionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchAdoptions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/adoptions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load adoptions");
      setAdoptions(data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch adoptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdoptions();
  }, []);

  const handleResolveAction = async (
    action: string,
    adoptionId?: string,
    projectId?: string,
    days?: number
  ) => {
    try {
      if (adoptionId) setActioningId(adoptionId);

      const res = await fetch("/api/adoptions/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          adoption_id: adoptionId,
          project_id: projectId,
          days,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Action failed");
        return;
      }

      toast.success(data.message || "Updated adoption state");
      await fetchAdoptions();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setActioningId(null);
    }
  };

  const receivedAdoptions = adoptions.filter(
    (a) => a.project?.user_id === user?.id
  );
  const sentAdoptions = adoptions.filter((a) => a.adopter_id === user?.id);

  const displayedList = activeTab === "received" ? receivedAdoptions : sentAdoptions;

  const renderStatusBadge = (status: string | null, deadline?: string | null) => {
    const isExpired = deadline && new Date(deadline).getTime() < Date.now();

    switch (status) {
      case "pending":
        return (
          <Badge className="border border-yellow-500/40 bg-yellow-600/20 text-yellow-300">
            <Clock className="mr-1 h-3 w-3 inline" /> Pending Review
          </Badge>
        );
      case "accepted":
        return (
          <div className="flex items-center gap-2">
            <Badge className="border border-blue-500/40 bg-blue-600/20 text-blue-300">
              <UserCheck className="mr-1 h-3 w-3 inline" /> Accepted (Awaiting Handoff)
            </Badge>
            {isExpired ? (
              <Badge className="border border-red-500/40 bg-red-600/20 text-red-300">
                <AlertTriangle className="mr-1 h-3 w-3 inline" /> Deadline Expired
              </Badge>
            ) : deadline ? (
              <Badge className="border border-zinc-700 bg-zinc-800 text-zinc-300">
                <Calendar className="mr-1 h-3 w-3 inline" /> Due:{" "}
                {new Date(deadline).toLocaleDateString()}
              </Badge>
            ) : null}
          </div>
        );
      case "completed":
        return (
          <Badge className="border border-green-500/40 bg-green-600/20 text-green-300">
            <CheckCircle2 className="mr-1 h-3 w-3 inline" /> Handoff Completed
          </Badge>
        );
      case "abandoned_by_adopter":
        return (
          <Badge className="border border-red-500/40 bg-red-600/20 text-red-300">
            <UserX className="mr-1 h-3 w-3 inline" /> Abandoned by Adopter
          </Badge>
        );
      case "superseded":
        return (
          <Badge className="border border-purple-500/40 bg-purple-600/20 text-purple-300">
            <HelpCircle className="mr-1 h-3 w-3 inline" /> Superseded (Other Selected)
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="border border-zinc-700 bg-zinc-800 text-zinc-400">
            <XCircle className="mr-1 h-3 w-3 inline" /> Declined
          </Badge>
        );
      default:
        return <Badge className="bg-zinc-800 text-zinc-400">{status || "Unknown"}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center space-x-2 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        <span>Loading adoption dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("received")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "received"
                ? "bg-violet-600 text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Received Applications ({receivedAdoptions.length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "sent"
                ? "bg-violet-600 text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            My Applications ({sentAdoptions.length})
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAdoptions}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Adoptions List */}
      {displayedList.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={`No ${activeTab} adoptions`}
          description={
            activeTab === "received"
              ? "You haven't received any adoption applications for your buried projects yet."
              : "You haven't applied to adopt any projects yet."
          }
        />
      ) : (
        <div className="space-y-4">
          {displayedList.map((item) => {
            const isOwner = item.project?.user_id === user?.id;
            const isPending = item.status === "pending";
            const isAccepted = item.status === "accepted";
            const isSuperseded = item.status === "superseded";
            const isProjectOpen = item.project?.is_adoptable;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/project/${item.project_id}`}
                      className="text-lg font-bold text-white hover:underline"
                    >
                      {item.project?.title || "Project"}
                    </Link>
                    <p className="text-xs text-zinc-400">
                      Applied {formatDistanceToNow(parseISO(item.created_at || new Date().toISOString()), { addSuffix: true })}
                    </p>
                  </div>
                  <div>{renderStatusBadge(item.status, item.responded_by_deadline)}</div>
                </div>

                <div className="mt-4 rounded-lg bg-zinc-950 p-3 text-sm text-zinc-300 border border-zinc-800/80">
                  <p className="text-xs font-semibold uppercase text-zinc-400 mb-1">
                    Application Message
                  </p>
                  &quot;{item.message}&quot;
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Avatar className="h-6 w-6 border border-zinc-700">
                      <AvatarImage
                        src={
                          isOwner
                            ? item.adopter?.avatar_url ?? undefined
                            : item.project?.user?.avatar_url ?? undefined
                        }
                      />
                      <AvatarFallback>
                        {(isOwner
                          ? item.adopter?.username || "A"
                          : item.project?.user?.username || "O"
                        )
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {isOwner ? "Applicant: " : "Owner: "}
                      <strong className="text-white">
                        @{isOwner ? item.adopter?.username || "unknown" : item.project?.user?.username || "Anonymous"}
                      </strong>
                    </span>
                  </div>

                  {/* ── OWNER ACTIONS ────────────────────────────────────── */}
                  {isOwner && (
                    <div className="flex flex-wrap gap-2">
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            disabled={actioningId === item.id}
                            onClick={() => handleResolveAction("accept", item.id)}
                            className="bg-green-600 text-white hover:bg-green-500 font-semibold"
                          >
                            Accept Request
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actioningId === item.id}
                            onClick={() => handleResolveAction("reject", item.id)}
                            className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          >
                            Decline
                          </Button>
                        </>
                      )}

                      {isAccepted && (
                        <>
                          <Button
                            size="sm"
                            disabled={actioningId === item.id}
                            onClick={() => handleResolveAction("complete", item.id)}
                            className="bg-violet-600 text-white hover:bg-violet-500 font-semibold"
                          >
                            Mark Completed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actioningId === item.id}
                            onClick={() => handleResolveAction("abandon_by_adopter", item.id)}
                            className="border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-900/60"
                          >
                            Mark Abandoned by Adopter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actioningId === item.id}
                            onClick={() => handleResolveAction("extend_deadline", item.id, undefined, 14)}
                            className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          >
                            Extend Deadline (+14 days)
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── ADOPTER ACTIONS ───────────────────────────────────── */}
                  {!isOwner && isSuperseded && isProjectOpen && (
                    <Button
                      size="sm"
                      disabled={actioningId === item.id}
                      onClick={() => handleResolveAction("re_request", undefined, item.project_id)}
                      className="bg-violet-600 text-white hover:bg-violet-500 font-semibold"
                    >
                      Re-request Adoption
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

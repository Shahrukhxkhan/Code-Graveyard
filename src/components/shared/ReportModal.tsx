"use client";

import { useState } from "react";
import { AlertCircle, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ReportReason, ReportTargetType } from "@/types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
}

const REASON_OPTIONS: { value: ReportReason; label: string; description: string }[] = [
  { value: "spam", label: "Spam", description: "Unsolicited promotional content or automated bot posts" },
  { value: "harassment", label: "Harassment", description: "Targeted hate speech, harassment, or abusive language" },
  { value: "plagiarism", label: "Plagiarism", description: "Stolen code or uncredited reproduction of work" },
  { value: "inappropriate", label: "Inappropriate Content", description: "NSFW, illegal, or malicious content" },
  { value: "other", label: "Other", description: "Any other issue requiring administrative review" },
];

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
          details: details.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "Failed to submit report";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      toast.success("Report submitted successfully. Thank you for helping moderate Code-Graveyard!");
      setDetails("");
      setReason("spam");
      onClose();
    } catch (err) {
      const msg = "An unexpected error occurred. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-white">
            <Flag className="h-5 w-5 text-red-400" />
            Report {targetType === "project" ? "Project" : "Snippet"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {targetTitle
              ? `Flag "${targetTitle}" for administrative moderation review.`
              : `Flag this ${targetType} for administrative moderation review.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason-select" className="text-sm font-medium text-zinc-200">
              Reason for reporting <span className="text-red-400">*</span>
            </Label>
            <select
              id="reason-select"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details-input" className="text-sm font-medium text-zinc-200">
              Additional Details <span className="text-xs text-zinc-400">(optional)</span>
            </Label>
            <Textarea
              id="details-input"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide context or explanation to help admins review this report..."
              className="border-zinc-700 bg-zinc-950 text-sm text-white placeholder:text-zinc-500 min-h-[90px]"
              maxLength={500}
            />
          </div>

          <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 font-semibold text-white hover:bg-red-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

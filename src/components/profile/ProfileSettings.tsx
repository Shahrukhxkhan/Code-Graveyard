"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ProfileSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [digestOptedIn, setDigestOptedIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoading(true);
        const res = await fetch("/api/user/preferences");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setEmailNotifications(data.email_notifications_enabled ?? true);
            setDigestOptedIn(data.digest_opted_in ?? true);
          }
        }
      } catch (err) {
        console.error("Failed to load user preferences:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const handleUpdate = async (field: "email_notifications_enabled" | "digest_opted_in", val: boolean) => {
    const prevEmail = emailNotifications;
    const prevDigest = digestOptedIn;

    if (field === "email_notifications_enabled") setEmailNotifications(val);
    if (field === "digest_opted_in") setDigestOptedIn(val);

    setSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: val }),
      });

      if (!res.ok) {
        throw new Error("Failed to save preference");
      }

      toast.success("Notification preferences updated!");
    } catch {
      // Revert on failure
      setEmailNotifications(prevEmail);
      setDigestOptedIn(prevDigest);
      toast.error("Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-zinc-800 rounded" />
        <div className="h-16 bg-zinc-800/60 rounded" />
        <div className="h-16 bg-zinc-800/60 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Email & Notification Preferences</h2>
        <p className="text-sm text-zinc-400">
          Manage how and when Code-Graveyard communicates with you.
        </p>
      </div>

      <div className="space-y-4">
        {/* Toggle 1: Event Notifications */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div>
            <h3 className="font-semibold text-white">Event Notifications</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Receive instant emails for adoption requests, status changes, and handoff deadlines.
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleUpdate("email_notifications_enabled", !emailNotifications)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              emailNotifications ? "bg-violet-600" : "bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                emailNotifications ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Weekly Digest Email */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div>
            <h3 className="font-semibold text-white">Weekly Digest Email</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Receive a weekly summary every Monday featuring top newly adoptable projects & platform stats.
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleUpdate("digest_opted_in", !digestOptedIn)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              digestOptedIn ? "bg-violet-600" : "bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                digestOptedIn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

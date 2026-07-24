"use client";

import { useEffect, useState } from "react";
import { BellRing, Mail, Check } from "lucide-react";
import { toast } from "sonner";

export function NotificationPreferences() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/user/preferences");
        if (res.ok) {
          const data = await res.json();
          setEmailEnabled(data.email_notifications_enabled ?? true);
        }
      } catch (err) {
        console.error("Failed to load notification preferences:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadPreferences();
  }, []);

  const handleToggle = async (newValue: boolean) => {
    setEmailEnabled(newValue);
    setSaving(true);

    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_notifications_enabled: newValue }),
      });

      if (res.ok) {
        toast.success(`Email notifications ${newValue ? "enabled" : "disabled"}`);
      } else {
        toast.error("Failed to update preferences");
        setEmailEnabled(!newValue); // revert on error
      }
    } catch (err) {
      toast.error("Network error updating preferences");
      setEmailEnabled(!newValue);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-20 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/50 p-4" />
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-violet-600/10 p-2.5 text-violet-400">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Email Notifications</h3>
            <p className="text-xs text-zinc-400">
              Receive instant emails when developers request to adopt your projects or when your adoption status updates.
            </p>
          </div>
        </div>

        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={emailEnabled}
            disabled={saving}
            onChange={(e) => void handleToggle(e.target.checked)}
            className="peer sr-only"
          />
          <div className="peer h-6 w-11 rounded-full bg-zinc-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-600 after:bg-zinc-400 after:transition-all after:content-[''] peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:after:bg-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500" />
        </label>
      </div>
    </div>
  );
}

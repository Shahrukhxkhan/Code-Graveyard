"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Inbox } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type NotificationItem = {
  id: string;
  user_id: string;
  type: "adoption_request" | "adoption_status" | string;
  title: string;
  body: string;
  related_project_id?: string | null;
  related_adoption_id?: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // 1. Fetch initial notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    void fetchNotifications();
  }, [user]);

  // 2. Supabase Realtime Subscription (postgres_changes)
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`realtime:notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newNotif = payload.new as NotificationItem;

          // Prepend new notification and increment count
          setNotifications((prev) => [newNotif, ...prev.slice(0, 29)]);
          setUnreadCount((prev) => prev + 1);

          // Alert user with live toast
          toast(newNotif.title, {
            description: newNotif.body,
            icon: "🔔",
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  // 3. Mark single notification as read & navigate
  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id }),
        });
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    setOpen(false);

    if (notif.related_project_id) {
      router.push(`/project/${notif.related_project_id}`);
    }
  };

  // 4. Mark all as read
  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Could not mark all as read");
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="relative rounded-full p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 border-zinc-800 bg-zinc-900 text-white shadow-xl md:w-96"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-violet-600/30 px-2 py-0.5 text-xs text-violet-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-violet-300"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <DropdownMenuSeparator className="bg-zinc-800" />

        <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/50">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
              <Inbox className="h-8 w-8 mb-2 stroke-1" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-zinc-600">
                Adoption updates will appear here
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                onClick={() => void handleItemClick(notif)}
                className={`cursor-pointer flex items-start gap-3 p-3 transition focus:bg-zinc-800 ${
                  !notif.is_read ? "bg-violet-950/20" : ""
                }`}
              >
                <div
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    !notif.is_read ? "bg-violet-500" : "bg-transparent"
                  }`}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">
                      {notif.title}
                    </p>
                    <span className="text-[11px] text-zinc-500">
                      {formatDistanceToNow(parseISO(notif.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 line-clamp-2">
                    {notif.body}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

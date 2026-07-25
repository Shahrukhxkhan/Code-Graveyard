import { redirect } from "next/navigation";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { AdminReportsClient } from "./AdminReportsClient";

export const metadata = {
  title: "Admin Moderation Queue | Code-Graveyard",
  description: "Review reported projects and snippets requiring moderation.",
};

export default async function AdminReportsPage() {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin, username")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_admin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
        <div className="rounded-full bg-red-600/20 p-4 text-red-400">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">403 - Access Denied</h1>
        <p className="mt-2 text-sm text-zinc-400">
          You do not have administrative privileges to view the content moderation queue.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-violet-400" />
            <h1 className="text-2xl font-bold text-white">Content Moderation Queue</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            Review user-submitted reports for spam, harassment, plagiarism, or inappropriate content.
          </p>
        </div>
      </div>

      <AdminReportsClient />
    </div>
  );
}

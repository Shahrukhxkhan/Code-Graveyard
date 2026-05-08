import Link from "next/link";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-12 text-center">
      <p className="text-5xl">{icon}</p>
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-xl text-zinc-400">{description}</p>
      {actionLabel && actionHref ? (
        <Button asChild className="mt-6 bg-violet-600 text-white hover:bg-violet-500">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-full bg-zinc-800" />
        <Skeleton className="h-6 w-28 rounded-full bg-zinc-800" />
      </div>
      <Skeleton className="h-6 w-2/3 bg-zinc-800" />
      <Skeleton className="mt-2 h-4 w-full bg-zinc-800" />
      <Skeleton className="mt-1 h-4 w-5/6 bg-zinc-800" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full bg-zinc-800" />
        <Skeleton className="h-5 w-16 rounded-full bg-zinc-800" />
        <Skeleton className="h-5 w-16 rounded-full bg-zinc-800" />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full bg-zinc-800" />
          <Skeleton className="h-4 w-20 bg-zinc-800" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full bg-zinc-800" />
      </div>
    </div>
  );
}

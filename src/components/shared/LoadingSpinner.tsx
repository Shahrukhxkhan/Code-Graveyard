import { cn } from "@/lib/utils";

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-12 w-12" : "h-8 w-8";

  return (
    <div className="flex w-full items-center justify-center">
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-zinc-700 border-t-violet-500",
          sizeClass,
        )}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

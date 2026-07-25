"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Uncaught UI Exception]:", error);
    Sentry.captureException(error, {
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="rounded-full bg-red-500/10 p-4 border border-red-500/30 mb-4">
        <span className="text-4xl">🪦</span>
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">
        Something went wrong in the Graveyard
      </h1>

      <p className="max-w-md text-sm text-zinc-400 mb-6">
        An unexpected error occurred while rendering this page. Our team has been notified via Sentry monitoring.
      </p>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="bg-violet-600 hover:bg-violet-500 text-white"
        >
          Try again
        </Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/")}
          className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
        >
          Return Home
        </Button>
      </div>
    </div>
  );
}

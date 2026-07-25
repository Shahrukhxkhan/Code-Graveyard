"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-zinc-950 text-white font-sans flex min-h-screen items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="text-5xl mb-4">🪦</div>
          <h1 className="text-2xl font-bold mb-2">Fatal System Error</h1>
          <p className="text-sm text-zinc-400 mb-6">
            A critical rendering exception occurred. The incident has been logged.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

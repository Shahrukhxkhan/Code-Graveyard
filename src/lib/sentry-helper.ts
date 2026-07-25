import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

/**
 * Reports unexpected API exceptions to Sentry with enriched request context and tags,
 * while respecting anonymity PII scrubbing rules.
 */
export function captureApiError(
  err: unknown,
  req?: Request,
  tags?: Record<string, string | boolean | number | null | undefined>
) {
  console.error("[API Route Error]:", err);

  Sentry.withScope((scope: any) => {
    if (tags) {
      Object.entries(tags).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          scope.setTag(key, String(val));
        }
      });
    }

    if (req) {
      scope.setTag("http.method", req.method);
      const url = new URL(req.url);
      scope.setTag("http.pathname", url.pathname);
    }

    // PII Safeguard: Strip user identity if anonymous project context
    if (tags?.is_anonymous === true || tags?.is_anonymous === "true") {
      scope.setUser(null);
    }

    Sentry.captureException(err);
  });

  const message = err instanceof Error ? err.message : "Internal Server Error";
  return NextResponse.json({ error: message }, { status: 500 });
}

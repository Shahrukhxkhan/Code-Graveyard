import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.0,
  debug: false,

  // PII & Privacy Scrubbing Hook
  beforeSend(event: Sentry.Event) {
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
      delete event.request.headers["x-supabase-auth"];
    }

    // Scrub anonymous project user identifiers
    if (event.extra?.is_anonymous || event.tags?.is_anonymous === "true") {
      if (event.user) {
        delete event.user.id;
        delete event.user.email;
        delete event.user.username;
      }
      if (event.tags) {
        delete event.tags.owner_id;
        delete event.tags.user_id;
      }
    }

    return event;
  },

  beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    // Strip sensitive tokens or passwords from breadcrumbs
    if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
      if (breadcrumb.data?.url && typeof breadcrumb.data.url === "string") {
        breadcrumb.data.url = breadcrumb.data.url.replace(/([?&]token=)[^&]+/i, "$1[REDACTED]");
      }
    }
    return breadcrumb;
  },
});

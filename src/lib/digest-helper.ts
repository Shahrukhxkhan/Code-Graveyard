import crypto from "crypto";

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "code-graveyard-digest-secret-key";

/**
 * Generates an HMAC SHA-256 signed token for single-click unsubscribe links.
 */
export function generateUnsubscribeToken(userId: string): string {
  return crypto.createHmac("sha256", SECRET).update(`unsubscribe:${userId}`).digest("hex");
}

/**
 * Verifies the signed HMAC SHA-256 unsubscribe token.
 */
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  if (!userId || !token) return false;
  const expected = generateUnsubscribeToken(userId);
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export type WeeklyStats = {
  total_buried: number;
  total_snippets: number;
  total_adoptions_completed: number;
};

export type DigestProject = {
  id: string;
  title: string;
  tagline: string;
  stage_of_death?: string | null;
  primary_tag?: string | null;
};

/**
 * Renders a lightweight, responsive plain HTML email template for the weekly digest.
 */
export function renderWeeklyDigestHtml(
  userId: string,
  projects: DigestProject[],
  stats: WeeklyStats,
  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
): string {
  const token = generateUnsubscribeToken(userId);
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe/digest?uid=${userId}&token=${token}`;

  const projectItemsHtml = projects
    .slice(0, 5)
    .map(
      (p) => `
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 14px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: bold; color: #ffffff; font-size: 16px;">${p.title}</span>
          ${p.stage_of_death ? `<span style="background-color: #3f3f46; color: #f4f4f5; font-size: 11px; padding: 2px 8px; border-radius: 12px;">${p.stage_of_death}</span>` : ""}
        </div>
        <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 10px 0;">${p.tagline}</p>
        <a href="${baseUrl}/project/${p.id}" style="color: #a855f7; font-size: 12px; text-decoration: none; font-weight: 500;">View Project & Request Adoption &rarr;</a>
      </div>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Code-Graveyard Weekly Digest 🪦</title>
</head>
<body style="background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; margin: 0;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 24px;">
    
    <div style="text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 20px;">
      <h1 style="color: #ffffff; font-size: 22px; margin: 0 0 6px 0;">Code-Graveyard Weekly Digest 🪦</h1>
      <p style="color: #a1a1aa; font-size: 13px; margin: 0;">Freshly abandoned projects ready for adoption this week</p>
    </div>

    <!-- Weekly Stats Banner -->
    <div style="background-color: #18181b; border-radius: 8px; padding: 12px; margin-bottom: 20px; display: table; width: 100%; box-sizing: border-box;">
      <div style="display: table-cell; text-align: center; width: 33%;">
        <div style="font-size: 18px; font-weight: bold; color: #ffffff;">${stats.total_buried}</div>
        <div style="font-size: 11px; color: #a1a1aa;">Buried This Week</div>
      </div>
      <div style="display: table-cell; text-align: center; width: 33%;">
        <div style="font-size: 18px; font-weight: bold; color: #ffffff;">${stats.total_snippets}</div>
        <div style="font-size: 11px; color: #a1a1aa;">Snippets Salvaged</div>
      </div>
      <div style="display: table-cell; text-align: center; width: 33%;">
        <div style="font-size: 18px; font-weight: bold; color: #a855f7;">${stats.total_adoptions_completed}</div>
        <div style="font-size: 11px; color: #a1a1aa;">Adoptions Completed</div>
      </div>
    </div>

    <h2 style="color: #ffffff; font-size: 16px; margin-bottom: 12px;">🌟 Newly Adoptable Projects</h2>
    ${projectItemsHtml}

    <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #27272a;">
      <a href="${baseUrl}" style="display: inline-block; background-color: #9333ea; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">Explore Full Graveyard</a>
    </div>

    <div style="text-align: center; margin-top: 28px; color: #71717a; font-size: 11px;">
      <p style="margin: 0 0 6px 0;">You are receiving this digest because you are subscribed to weekly updates on Code-Graveyard.</p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #a1a1aa; text-decoration: underline;">Unsubscribe from Weekly Digest</a>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

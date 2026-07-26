import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyUnsubscribeToken } from "@/lib/digest-helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("uid");
    const token = searchParams.get("token");

    if (!userId || !token) {
      return new NextResponse(
        renderHtmlResponse(
          "Invalid Request",
          "Missing unsubscribe parameters. Please use the direct link provided in your digest email.",
          false
        ),
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    const isValid = verifyUnsubscribeToken(userId, token);
    if (!isValid) {
      return new NextResponse(
        renderHtmlResponse(
          "Unsubscribe Failed",
          "The unsubscribe token is invalid or expired.",
          false
        ),
        { status: 403, headers: { "Content-Type": "text/html" } }
      );
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from("users")
      .update({ digest_opted_in: false })
      .eq("id", userId);

    if (error) {
      console.error("[Unsubscribe Error]:", error.message);
      return new NextResponse(
        renderHtmlResponse(
          "Database Error",
          "Could not update preference at this time. Please try again later.",
          false
        ),
        { status: 500, headers: { "Content-Type": "text/html" } }
      );
    }

    return new NextResponse(
      renderHtmlResponse(
        "Successfully Unsubscribed",
        "You have been unsubscribed from the Code-Graveyard Weekly Digest. You can re-enable it at any time in your profile preferences.",
        true
      ),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    console.error("[Unsubscribe Exception]:", err);
    return new NextResponse(
      renderHtmlResponse("Error", err.message || "An unexpected error occurred.", false),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

function renderHtmlResponse(title: string, message: string, success: boolean): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - Code-Graveyard</title>
</head>
<body style="background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px;">
  <div style="max-width: 440px; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; text-align: center;">
    <div style="font-size: 40px; margin-bottom: 12px;">${success ? "🪦" : "⚠️"}</div>
    <h1 style="font-size: 20px; font-weight: bold; color: #ffffff; margin: 0 0 12px 0;">${title}</h1>
    <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5; margin: 0 0 24px 0;">${message}</p>
    <a href="${siteUrl}" style="display: inline-block; background-color: #9333ea; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">Return to Code-Graveyard</a>
  </div>
</body>
</html>
  `.trim();
}

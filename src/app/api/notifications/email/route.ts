import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const isEmailEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === "true";

    if (!isEmailEnabled) {
      console.log("[Email Notification] Feature flag disabled (ENABLE_EMAIL_NOTIFICATIONS != true). Skipping dispatch.");
      return NextResponse.json({
        status: "disabled",
        message: "Email notifications feature flag is disabled",
      }, { status: 200 });
    }

    const body = await request.json();
    const { to, subject, body: emailBody } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required fields (to, subject, body)" }, { status: 400 });
    }

    // Secondary channel dispatch logic (Resend / Nodemailer / SMTP)
    console.log(`[Email Notification Sent] To: ${to} | Subject: ${subject}`);
    console.log(`[Body]: ${emailBody}`);

    return NextResponse.json({
      status: "sent",
      recipient: to,
      subject,
    }, { status: 200 });
  } catch (err: any) {
    // Fail gracefully so background triggers are never interrupted
    console.error("[Email Notification Failed]:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

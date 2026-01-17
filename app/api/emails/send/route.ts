import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, from, apiKey} = body;

    const apiKeyToUse = apiKey || process.env.RESEND_API_KEY;

    if (!apiKeyToUse) {
      return NextResponse.json(
        { error: "API key is required. Please configure it in settings." },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKeyToUse);

    if (!to || !subject || !(html || text)) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, and html or text" },
        { status: 400 }
      );
    }

    const emailOptions = {
      from: from || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || undefined,
      text: text || undefined,
      ...(body.replyTo && { reply_to: body.replyTo }),
    };

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

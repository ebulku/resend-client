import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get("apiKey") || process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required. Please configure it in settings." },
        { status: 400 },
      );
    }

    const resend = new Resend(apiKey);

    // Fetch email details
    const { data: emailData, error: emailError } = await resend.emails.get(id);

    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 400 });
    }

    // Fetch attachments using the specific method
    let attachments: unknown[] = [];
    try {
      const { data: attachmentsData } = await resend.emails.attachments.list({
        emailId: id,
      });

      if (attachmentsData && attachmentsData.data) {
        attachments = attachmentsData.data;
      }
    } catch (attachError) {
      console.error("Failed to fetch attachments:", attachError);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...emailData,
          attachments,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch sent email";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

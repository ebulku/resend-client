import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const after = searchParams.get("after") || undefined;
    const before = searchParams.get("before") || undefined;
    const apiKey = searchParams.get("apiKey") || process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required. Please configure it in settings." },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    // Build query options for received emails
    // Note: after and before cannot be used together
    let listOptions:
      | { limit?: number; after?: string }
      | { limit?: number; before?: string } = {};

    if (limit) {
      listOptions.limit = limit;
    }

    if (after) {
      listOptions = { ...listOptions, after };
    } else if (before) {
      listOptions = { ...listOptions, before };
    }

    const { data, error } = await resend.emails.receiving.list(listOptions);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch received emails";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

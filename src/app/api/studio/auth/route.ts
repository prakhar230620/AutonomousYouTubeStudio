import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { COOKIE_NAME, hasStudioSession, issueStudioSession } from "@/lib/studio/auth";

export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: hasStudioSession(request) });
}

export async function POST(request: NextRequest) {
  const expected = process.env.STUDIO_DASHBOARD_PASSWORD;
  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  if (!expected || typeof body?.password !== "string" || !safeEqual(expected, body.password)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  try {
    const session = issueStudioSession();
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(COOKIE_NAME, session.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: session.maxAge,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Session setup failed." },
      { status: 503 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}

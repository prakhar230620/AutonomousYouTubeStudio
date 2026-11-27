import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "studio_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function signature(expiresAt: string, secret: string) {
  return createHmac("sha256", secret).update(expiresAt).digest("hex");
}

export function issueStudioSession() {
  const secret = process.env.STUDIO_SESSION_SECRET;
  if (!secret) throw new Error("STUDIO_SESSION_SECRET is not configured.");
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return { value: expiresAt + "." + signature(expiresAt, secret), maxAge: SESSION_SECONDS };
}

export function hasStudioSession(request: NextRequest): boolean {
  const secret = process.env.STUDIO_SESSION_SECRET;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!secret || !token) return false;
  const [expiresAt, provided, extra] = token.split(".");
  if (!expiresAt || !provided || extra || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;
  const expected = signature(expiresAt, secret);
  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export { COOKIE_NAME };

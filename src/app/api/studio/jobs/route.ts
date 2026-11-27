import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { hasStudioSession } from "@/lib/studio/auth";
import { inngest } from "@/inngest/client";
import { videoRequested } from "@/inngest/events";
import { getStudioDb } from "@/lib/studio/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RequestSchema = z.object({
  topic: z.string().trim().min(3).max(300),
  language: z.enum(["hi-IN", "en-IN", "en-US"]).default("hi-IN"),
  channelContext: z.string().trim().max(1200).optional(),
  targetDurationMinutes: z.number().int().min(1).max(60).default(8),
});

function serviceTokenAuthorized(request: NextRequest) {
  const expected = process.env.STUDIO_API_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

function authorized(request: NextRequest) {
  return hasStudioSession(request) || serviceTokenAuthorized(request);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = getStudioDb();
    const { data, error } = await db
      .from("studio_video_jobs")
      .select("id, topic, language, status, progress, created_at, updated_at, last_error")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw error;
    return NextResponse.json({ jobs: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load jobs." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const db = getStudioDb();
    const { data: job, error } = await db
      .from("studio_video_jobs")
      .insert({
        topic: parsed.data.topic,
        language: parsed.data.language,
        channel_context: parsed.data.channelContext ?? null,
        target_duration_minutes: parsed.data.targetDurationMinutes,
        status: "queued",
        progress: 0,
        max_repair_attempts: 3,
      })
      .select("id, topic, language, status, created_at")
      .single();

    if (error || !job) throw new Error(error?.message ?? "Could not create production job.");

    try {
      await inngest.send(videoRequested.create({
        jobId: job.id,
        topic: parsed.data.topic,
        language: parsed.data.language,
        channelContext: parsed.data.channelContext,
        targetDurationMinutes: parsed.data.targetDurationMinutes,
      }));
    } catch (dispatchError) {
      await db.from("studio_video_jobs").update({
        status: "failed",
        last_error: "Could not dispatch the durable workflow.",
        updated_at: new Date().toISOString(),
      }).eq("id", job.id);
      throw dispatchError;
    }

    return NextResponse.json({ job }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start video production." },
      { status: 503 },
    );
  }
}

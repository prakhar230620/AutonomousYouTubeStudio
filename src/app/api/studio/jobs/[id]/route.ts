import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasStudioSession } from "@/lib/studio/auth";
import { getStudioDb } from "@/lib/studio/supabase-admin";

const IdSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasStudioSession(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!IdSchema.safeParse(id).success) return NextResponse.json({ error: "Invalid job id" }, { status: 400 });

  try {
    const db = getStudioDb();
    const { data, error } = await db
      .from("studio_video_jobs")
      .select("id, topic, language, status, progress, script, last_error, created_at, updated_at")
      .eq("id", id)
      .single();
    if (error || !data) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    return NextResponse.json({ job: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load job." }, { status: 503 });
  }
}

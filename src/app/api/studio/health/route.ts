import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    scriptGeneration: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_SCRIPT_MODEL),
    database: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    dashboardAuth: Boolean(process.env.STUDIO_DASHBOARD_PASSWORD && process.env.STUDIO_SESSION_SECRET),
    orchestration: Boolean(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY),
    objectStorage: Boolean(
      process.env.OBJECT_STORAGE_ENDPOINT &&
      process.env.OBJECT_STORAGE_ACCESS_KEY_ID &&
      process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY &&
      process.env.OBJECT_STORAGE_BUCKET
    ),
    voiceoverAdapter: Boolean(process.env.VOICEOVER_API_URL),
    renderWorker: Boolean(process.env.RENDER_WORKER_URL && process.env.RENDER_WORKER_TOKEN),
    youtubeOAuth: Boolean(
      process.env.YOUTUBE_CLIENT_ID &&
      process.env.YOUTUBE_CLIENT_SECRET &&
      process.env.YOUTUBE_REDIRECT_URI
    ),
    youtubePublishingEnabled: process.env.YOUTUBE_PUBLISHING_ENABLED === "true",
  };

  return NextResponse.json({
    service: "autonomous-youtube-studio",
    status: Object.values(checks).every(Boolean) ? "configured" : "setup_required",
    checks,
    note: "Only configuration presence is reported; secret values are never returned.",
  });
}

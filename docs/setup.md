# Setup

## Vercel
Link this repository as a new Vercel project. Use Node.js 20.x or newer. Add the variables from `.env.example` to Preview/Production as applicable.

## Supabase
Create a dedicated Supabase project for this app. Apply `supabase/migrations/202611270001_studio_video_jobs.sql`. Add the project URL and service-role key to Vercel. The service-role key is server-only.

## Dashboard protection
Set a strong `STUDIO_DASHBOARD_PASSWORD` and a separate `STUDIO_SESSION_SECRET` (at least 32 random bytes). The browser receives only a signed, HTTP-only, SameSite=Strict session cookie.

## Script workflow
Set `OPENAI_API_KEY` and `OPENAI_SCRIPT_MODEL`. Create an Inngest app, set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`, deploy, then sync the `/api/inngest` endpoint.

## First test
Sign in to the dashboard, submit a topic and verify that a job row and script are saved. The job deliberately pauses at `needs_human_review` while the voiceover adapter contract remains unverified.

## Remaining integrations
Verify the Voiceover Studio Connect/MessagePack contract; configure private S3/R2 storage; deploy a Remotion/FFmpeg worker; add frame-level QA and bounded repair; add thumbnail/metadata generation; and complete YouTube OAuth. Keep uploads private until the workflow is tested.

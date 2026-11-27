# Autonomous YouTube Studio

An end-to-end YouTube production workspace: plan, script, narration, storyboard, render, synchronize, inspect, repair, thumbnail, metadata, and channel-owner-approved publishing.

> Current status: foundation in active development. Automated publishing is disabled by default; voiceover and render adapters must be verified before live production.

## Architecture

- Next.js dashboard and protected API
- Supabase for durable job state
- Inngest for resumable workflow orchestration
- Existing Vercel Voiceover Studio integration behind a verified adapter
- Remotion/FFmpeg render and QA worker
- YouTube Data API OAuth for channel-owner-authorized uploads

See `docs/architecture.md` and `docs/setup.md`.

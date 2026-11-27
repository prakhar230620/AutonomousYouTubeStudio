# Autonomous YouTube Studio — Architecture

Topic/brief → research and script → voiceover → storyboard → render → audio/video synchronization → frame-level inspection → targeted repair and re-inspection → thumbnail → title/description/chapters/tags → channel-owner-approved YouTube upload.

## System layout
- Next.js dashboard/API on Vercel.
- Supabase Postgres for durable job state, scripts, scene plans, attempts, findings and upload references.
- Inngest for checkpointed, resumable orchestration.
- Private object storage for audio, scene assets, renders, contact sheets and thumbnails.
- Voiceover adapter for the existing Vercel Voiceover Studio; its Connect/MessagePack contract must be verified first.
- Remotion compositions and an FFmpeg worker for rendering, muxing, audio measurements, contact sheets and technical checks.
- Deterministic QA plus vision review for keyframes/contact sheets.
- YouTube Data API OAuth for channel-owner-authorized uploads.

## Synchronization model
Measured voiceover audio is the master clock. Scene boundaries are fitted to the measured file duration. Do not treat estimated narration duration as actual speech duration. Prefer word/phrase alignment from the voice provider; otherwise use scene-level timing and measured audio duration. Limit speech-rate changes.

## QA and repair
Every render is immutable and linked to its QA report. Blocking issues prevent thumbnail and upload. Repair only failed scenes or audio ranges, produce a new render version, and rerun the full QA gate. Default maximum repair attempts: three. Escalate unresolved issues for human review.

## Publishing safeguards
Publishing is disabled by default, OAuth tokens are stored server-side, default privacy is private, public upload requires a separate per-video approval, and failed QA blocks upload.

## Current implementation boundary
The app shell, password-protected dashboard, job API, Supabase schema, durable script-generation workflow and health checks are implemented. Voiceover, render, frame inspection, repair, thumbnail and YouTube adapters still require integration and end-to-end validation.

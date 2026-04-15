# Golf Swing Analyzer Starter Pack

A starter repository for a small app that analyzes golf swing video using:

- **Next.js 15 + TypeScript** for the web app
- **OpenRouter** for video-capable LLM analysis
- **Pose estimation + metric extraction** as the deterministic motion layer
- **Structured prompts** for coaching feedback

## Recommended build path

1. Upload a swing video from desktop or mobile
2. Store the file locally or in object storage
3. Extract metadata and sample frames
4. Run pose estimation and phase detection
5. Build a compact analysis payload
6. Send video or curated payload to OpenRouter
7. Return structured coaching feedback to the UI
8. Persist swing sessions for comparison over time

## Why this architecture

Pure LLM-based raw video review is not robust enough for golf feedback. The app should:

- **measure** swing mechanics itself where possible
- use the video model to **observe and interpret**
- use a reasoning model to **coach and summarize**

## Current starter-pack scope

This repo includes:

- Next.js upload and analysis flow
- typed contracts for analysis, taxonomy, and phase scoring
- OpenRouter-backed coaching provider with mock fallback
- local session history and media artifact extraction
- storage abstractions for sessions, uploads, and artifacts
- a Neon session repository adapter
- S3-compatible upload and artifact storage adapters
- prompt templates and implementation roadmap

It does **not** yet include:

- a production pose-estimation engine
- authentication
- a fully configured production object-storage account
- a deployed Vercel environment

## Fastest route from here

### Option A — Fastest overall
Use this starter pack as the repo foundation, then open it in **Codex** and ask it to implement the remaining tasks in sequence.

Best when you want minimal copy/paste and a more integrated build loop.

### Option B — Fastest with your current tooling
Use this starter pack as the repo foundation, then hand the zip to **Claude Code** and have it implement from the included docs and task list.

Best when you already prefer Claude Code and want direct control on your own machine.

## Suggested first implementation prompt

See `docs/IMPLEMENTATION_TASKS.md`.

## Environment

Copy `.env.example` to `.env.local` and set values.

```bash
cp .env.example .env.local
npm install
npm run dev
```

### Local development defaults

The local development path can run entirely from disk:

- `SESSION_REPOSITORY_PROVIDER=local`
- `UPLOAD_STORAGE_PROVIDER=local`
- `ARTIFACT_STORAGE_PROVIDER=local`
- `COACHING_ANALYSIS_PROVIDER=mock` or `openrouter`

### Beta deployment target

The current deployment path is:

- Vercel for the Next.js app
- Neon for session metadata
- S3-compatible object storage for uploaded videos and still images

For hosted environments without `ffmpeg`, the app can fall back to a no-op
media-artifact provider so analysis still completes without poster/key-frame extraction.

See [`docs/DEPLOYMENT_PLAN.md`](docs/DEPLOYMENT_PLAN.md) for the staged rollout checklist.

## Future milestones

- add real pose estimation
- add swing comparison history
- add front/side view support
- add club path / tempo / hip-shoulder separation metrics
- add multi-model routing between Gemini / Reka / fallback text model

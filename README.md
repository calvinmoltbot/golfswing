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

- project structure
- typed contracts
- OpenRouter client wrapper
- API route scaffold
- prompt templates
- implementation roadmap
- placeholder hooks for pose estimation and phase detection

It does **not** yet include:

- a production pose-estimation engine
- a real database
- authentication
- object storage
- a polished UI

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

## Future milestones

- add real pose estimation
- add swing comparison history
- add front/side view support
- add club path / tempo / hip-shoulder separation metrics
- add multi-model routing between Gemini / Reka / fallback text model

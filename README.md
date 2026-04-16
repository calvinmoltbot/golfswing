# Golf Swing Analyzer

This repo is currently optimized for one practical goal:

- run the app locally on a MacBook
- let a golfer upload short swing clips
- collect real feedback on whether the analysis is useful

The active path is a **local beta**, not a hosted rollout.

## What works today

- upload a swing video
- save sessions
- generate still images locally with `ffmpeg`
- run the mocked motion-analysis pipeline
- return structured coaching output from OpenRouter or the mock provider
- review sessions and re-run analysis

## Best use right now

Give this to one tester on a MacBook and learn:

- whether the feedback sounds believable
- whether the still images help
- whether the priority fixes and drills are useful
- what feels obviously wrong to a good golfer

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Local beta path

For a non-technical tester, use the launcher scripts:

- [Start Golf Swing.command](./Start%20Golf%20Swing.command)
- [Stop Golf Swing.command](./Stop%20Golf%20Swing.command)
- [Update Golf Swing.command](./Update%20Golf%20Swing.command)

Read these first:

- [Local beta setup](./docs/LOCAL_BETA_SETUP.md)
- [Tester handoff](./docs/TESTER_HANDOFF.md)

## Required local setup

The tester only needs:

1. Node.js LTS
2. `ffmpeg`
3. the app folder
4. a working `.env.local`

`git` is optional unless they will pull updates themselves.

## Current architecture

The repo still contains abstractions for:

- local storage
- Neon-backed sessions
- S3-compatible media storage

Those are fine to keep, but they are not the main path right now. The priority is the local beta experience and analysis quality.

## Main gaps

- the pose/phases layer is still partly mocked
- the coaching needs feedback from a real golfer
- the local beta still needs testing on a genuinely clean MacBook

## Deferred work

Hosted deployment is a later phase.

If we come back to it later, start with:

- [Deployment plan](./docs/DEPLOYMENT_PLAN.md)

## Near-term priorities

1. hand the local beta to your nephew
2. collect feedback from real swings
3. tighten analysis quality based on what he finds wrong or useful

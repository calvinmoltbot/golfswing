# Implementation Tasks

## Current state

Completed:

1. File upload to a server route
2. Local file persistence for development
3. Persisted session records on disk
4. Sessions list page
5. Mocked analysis pipeline using the typed response contract

## Next stage 1 — isolate the motion pipeline

1. Create a `services/pose-estimation` module with a small provider interface
2. Define provider input and output types:
   - input: local video file path
   - output: keypoints, derived metrics, key frames, and provider metadata
3. Move the current mock pose logic behind a `mock` provider implementation
4. Update the analyze route to depend on the provider interface only
5. Persist pose-estimation output on each session record
6. Persist phase-detection output on each session record
7. Add a session details page to inspect stored pipeline artifacts
8. Add a simple provider selection mechanism through config or environment variables
9. Add tests for the provider contract and session persistence shape

## Next stage 2 — extract media artifacts

1. Add a media service interface for thumbnails and key-frame extraction
2. Implement a local development adapter using `ffmpeg` if available
3. Detect and report clearly when `ffmpeg` is unavailable
4. Generate a poster thumbnail for each upload
5. Extract key-frame images for address, top, impact, and finish
6. Persist media artifact paths on each session record
7. Show thumbnails on the sessions page
8. Show key frames on the session details page
9. Add cleanup rules for derived local artifacts

## Next stage 3 — harden analysis orchestration

1. Split analysis into explicit steps:
   - upload
   - preprocess
   - pose estimation
   - phase detection
   - coaching analysis
   - persistence
2. Add a small orchestration service instead of keeping pipeline logic in the route
3. Make session status transitions explicit and validated
4. Add structured error types for pipeline failures
5. Store failure reason and failing stage on the session record
6. Add idempotent rerun support for a session
7. Add a reanalyze action in the UI
8. Add server-side logging around pipeline timings

## Next stage 4 — replace mock coaching with model-backed analysis

1. Create a coaching-analysis service interface separate from pose estimation
2. Keep the current mock analysis implementation as a fallback provider
3. Reuse the existing typed response contract as the stable output boundary
4. Move OpenRouter-specific logic behind the coaching provider
5. Build a payload mapper from persisted session data to prompt input
6. Validate and sanitize model output against the response schema
7. Save raw model metadata needed for debugging:
   - model name
   - request timestamp
   - provider identifier
   - parse or validation errors
8. Add environment-guarded switching between mock and real providers
9. Add retry and timeout handling for model calls

## Next stage 5 — improve the product surface

1. Add a session details page with:
   - upload metadata
   - analysis summary
   - phase observations
   - drills
   - warnings
   - thumbnails and key frames when available
2. Add filtering and sorting on the sessions page
3. Add compare-two-sessions selection UI
4. Add a basic comparison view for two saved sessions
5. Add support for tagging sessions by club and camera view
6. Add editable player notes after upload
7. Add a lightweight empty, loading, and error state pass across the UI

## Next stage 6 — production hardening

1. Replace local disk persistence with swappable storage abstractions
2. Add object storage support for uploaded clips and derived media
3. Add a real database-backed session repository
4. Add authentication
5. Add rate limiting on upload and analysis routes
6. Move heavy processing into background jobs
7. Add observability and pipeline metrics
8. Add audit-friendly prompt and model-call logging
9. Add retention rules for uploads and derived artifacts
10. Add deployment-specific configuration and health checks

## Backlog — analysis quality

1. Add separate prompt strategies for face-on and down-the-line views
2. Add real pose-estimation integration
3. Add phase-detection refinement from real motion data
4. Add drill library with mapping rules
5. Add confidence calibration logic
6. Add coach mode vs concise mode
7. Add player goals and shot-shape context
8. Add club path, tempo, and hip-shoulder separation metrics
9. Add multi-model routing and fallback handling

## Good implementation prompt

Implement the next stage for this repository in small working steps.
Start with:

- an isolated `services/pose-estimation` provider interface
- a mock provider implementation using the current placeholder logic
- persisted pose and phase outputs on the session record
- a session details page to inspect stored pipeline artifacts

Keep the code simple and production-minded.
Do not add unnecessary dependencies.
Commit after each stable milestone.

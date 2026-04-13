# Implementation Tasks

## Phase 1 — make the app real

1. Replace placeholder `videoUrl` flow with file upload support
2. Add local temp storage or S3-compatible storage
3. Add real pose estimation pipeline
4. Add thumbnail and key-frame extraction
5. Add phase detection refinement
6. Add result persistence
7. Add session history page
8. Add compare-two-swings view

## Phase 2 — improve analysis quality

1. Add separate prompts for face-on and down-the-line
2. Add drill library with mapping rules
3. Add confidence calibration logic
4. Add coach mode vs concise mode
5. Add player goals and shot-shape context

## Phase 3 — production hardening

1. Add auth
2. Add rate limiting
3. Add job queue for heavier processing
4. Add observability and prompt logging
5. Add model routing and fallback handling

## Good Codex / Claude Code prompt

Build the MVP for this repository in small working steps.
Start by implementing:

- file upload to a server route
- local file persistence for development
- a page showing uploaded swing sessions
- a mocked analysis pipeline using the existing typed response contract

Keep the code simple and production-minded.
Do not add unnecessary dependencies.
After that, add a clearly isolated pose-estimation service interface that can later be swapped from mock to real implementation.

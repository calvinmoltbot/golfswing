# Architecture

## Core principle

The app should not rely on an LLM alone to infer all motion mechanics from video.

Instead:

- the **app** extracts deterministic measurements
- the **video-capable model** reviews video context or selected frames
- the **reasoning layer** explains and prioritizes fixes

## MVP request lifecycle

1. Client submits video URL or upload reference
2. Server validates input and fetches metadata
3. Pose extraction runs
4. Swing phases are estimated
5. Compact payload is created
6. OpenRouter model returns structured coaching JSON
7. Response is rendered and stored

## Recommended early constraints

- single swing clip only
- one golfer in frame
- one camera angle at a time
- 2–5 seconds per clip
- stable camera preferred

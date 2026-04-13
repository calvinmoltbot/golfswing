# Codex Handoff Notes

## Best way to use this repo in Codex

1. Create a new local git repo from this starter pack
2. Open the folder in Codex
3. Ask Codex to read:
   - `README.md`
   - `docs/ARCHITECTURE.md`
   - `docs/IMPLEMENTATION_TASKS.md`
4. Tell it to implement one phase at a time and commit after each stable milestone

## First Codex task

Implement the MVP upload flow with local development storage and a simple sessions list page. Use the existing types and API route shape. Keep the initial pipeline mocked but real enough to demo end to end.

## After that

Implement a `services/pose-estimation` layer with:

- input video file path
- extracted keypoints output
- derived metrics output
- clean interface for later provider swaps

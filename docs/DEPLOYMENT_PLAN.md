# Deployment Plan

This is now a deferred document.

The active product path is the **local beta on a MacBook**, using:

- local file storage
- local `ffmpeg`
- the launcher scripts

Use this document only if we come back to hosted deployment later.

## Current recommendation

Do not spend more time on hosted infrastructure until we get real golfer feedback from the local beta.

The important near-term questions are product questions:

- Is the analysis believable?
- Are the fixes useful?
- Do the stills help?
- Which parts feel obviously wrong to a good golfer?

## What already exists for later

If we return to deployment later, the repo already contains:

- a Neon session repository adapter
- S3-compatible upload storage
- S3-compatible artifact storage
- previous Vercel deployment work

So the hosted work is not lost. It is just not the priority right now.

## If we revisit hosted deployment

Resume in this order:

1. re-check Vercel env configuration
2. re-verify Neon-backed session storage
3. re-verify S3/R2-backed upload and artifact storage
4. solve hosted still-image extraction
5. run a full hosted smoke test again

## Why we paused hosted work

The local beta path won because:

- local `ffmpeg` gives us still extraction now
- the local setup is simpler to hand to a single tester
- real golfer feedback matters more than more infrastructure

Once the local beta proves the product value, we can come back to hosted delivery with better confidence.

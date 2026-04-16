# Tester Handoff

Use this when handing the app to a golfer for local testing.

## What they need

- a MacBook
- Node.js installed
- `ffmpeg` installed
- `git` installed
- the app folder
- the provided `.env.local`

## What they do

1. Double-click `Start Golf Swing.command`
2. Wait for the browser to open
3. Upload a short swing clip
4. Review the result
5. Double-click `Stop Golf Swing.command` when finished

## What to ask them

- Did the upload feel reliable?
- Did the still images help?
- Did the summary sound believable?
- Were the priority fixes useful?
- Was anything obviously wrong or misleading?

## What to tell them

- Use short clips with one swing only
- Face-on and down-the-line are both useful
- If something breaks, send back `.beta/server.log`

## Update path

1. Double-click `Update Golf Swing.command`
2. Then start the app again

`Update Golf Swing.command` only updates the code. It does not replace `.env.local`.

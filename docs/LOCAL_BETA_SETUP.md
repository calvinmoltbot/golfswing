# Local Beta Setup

This is the simplest way to run the app on a MacBook for a non-technical tester.

## One-time setup

Install these once:

1. `Node.js` LTS
2. `ffmpeg`
3. `git` if the tester needs to pull updates

Suggested install commands:

```bash
brew install node
brew install ffmpeg
```

## Required app files

The folder needs:

- the full app repository
- a working `.env.local`

## How the tester uses it

### Start the app

Double-click:

- `Start Golf Swing.command`

That script will:

- check for `node`, `npm`, `ffmpeg`, and `.env.local`
- run an environment sanity check
- install dependencies if `node_modules` is missing
- build the app
- start the server locally
- open the browser automatically

### Stop the app

Double-click:

- `Stop Golf Swing.command`

### Pull the latest version

If the tester has `git` and the repository is already cloned:

- double-click `Update Golf Swing.command`

That will:

- run `git pull --ff-only`
- run `npm install`

## Notes

- Server logs are written to `.beta/server.log`
- The running server PID is stored in `.beta/server.pid`
- Default local URL is `http://127.0.0.1:3000`
- If you do not want the script to open the browser automatically, run it from
  Terminal with `AUTO_OPEN=0 ./scripts/start-beta.sh`

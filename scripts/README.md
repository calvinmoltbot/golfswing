# Scripts

Current scripts:

- `check-env.mjs`
  Validates the current provider configuration for local or production runs.
  It loads `.env.local` and `.env` when present, then checks whether the
  selected storage, database, and coaching providers have the required
  environment variables.

- `start-beta.sh`
  Builds the app, starts the local server, waits for it to respond, and opens
  the browser automatically. Set `AUTO_OPEN=0` to skip opening the browser.

- `stop-beta.sh`
  Stops the local beta server using the saved PID file.

- `update-beta.sh`
  Pulls the latest Git changes and installs any updated dependencies.

Example:

```bash
npm run check:env
```

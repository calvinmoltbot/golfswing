# Scripts

Current scripts:

- `check-env.mjs`
  Validates the current provider configuration for local or production runs.
  It loads `.env.local` and `.env` when present, then checks whether the
  selected storage, database, and coaching providers have the required
  environment variables.

Example:

```bash
npm run check:env
```

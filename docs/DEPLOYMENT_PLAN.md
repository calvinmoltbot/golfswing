# Deployment Plan

## Goal

Deploy the app on Vercel for the app layer, with:

- Neon for session metadata
- object storage for uploaded videos and derived artifacts
- local disk retained only as the development adapter

## Current state

The app now separates:

- upload persistence behind `UploadStorage`
- session persistence behind `SessionRepository`

Current runtime uses the local implementations only:

- `lib/storage/local/upload-storage.ts`
- `lib/storage/local/session-repository.ts`

This keeps behavior unchanged in development while making production adapters possible.

Current implementation progress:

- Neon session repository exists and is selectable via env
- Neon project `golfswing` was created in the personal Neon org
- `db/neon/001_create_swing_sessions.sql` has been applied to that project
- uploads can now be staged for processing through the upload-storage abstraction
- media artifact serving and cleanup now go through artifact-storage abstractions rather than direct route-level disk reads
- both uploads and artifacts now have first-pass S3-compatible adapters
- local smoke tests have now validated the full stack with:
  - `SESSION_REPOSITORY_PROVIDER=neon`
  - `UPLOAD_STORAGE_PROVIDER=s3`
  - `ARTIFACT_STORAGE_PROVIDER=s3`
  - R2-backed upload and artifact reads
  - Neon-backed session create/read/write

## Recommended production shape

### App

- Host the Next.js app on Vercel
- Keep API routes in the app for now

### Database

- Use Neon Postgres for session metadata
- Store:
  - session id
  - created/updated timestamps
  - upload metadata
  - player context
  - report mode
  - player goal / usual miss / shot shape / skill band
  - pipeline state
  - analysis result JSON
  - provider metadata
  - object-storage keys or URLs for uploaded video and artifacts

### Object storage

Use one of:

- Cloudflare R2
- AWS S3
- another S3-compatible object store

Store:

- original uploaded video
- poster image
- key-frame images

Do not rely on local filesystem writes in production.

## Implementation sequence

### Phase 1 — upload storage adapter

Add a production `UploadStorage` adapter that:

- writes uploads to object storage
- returns object key, URL, and metadata
- optionally stages temporary local files only while analysis runs

Questions to settle:

- keep public URLs vs signed URLs
- object key layout
- retention policy

### Phase 2 — session repository adapter

Add a Neon-backed `SessionRepository` that:

- creates sessions from uploads
- saves pipeline state
- reads sessions by id
- lists sessions
- deletes sessions

Likely shape:

- one `swing_sessions` table
- JSON columns for pipeline state and analysis payloads initially
- evolve toward normalized tables only if necessary later

Current implementation status:

- `lib/storage/neon/session-repository.ts` adds the first Neon adapter
- `db/neon/001_create_swing_sessions.sql` defines the initial table
- runtime can opt into it with `SESSION_REPOSITORY_PROVIDER=neon`
- `DATABASE_URL` or `NEON_DATABASE_URL` is required when the Neon adapter is selected
- fresh Neon project created: `golfswing` (`green-sunset-66448055`)
- initial schema has already been applied there

This still requires a real production `DATABASE_URL` to be configured in Vercel before the Neon adapter can be used in the hosted app.

### Phase 3 — artifact storage adapter

Refactor media artifact handling so ffmpeg outputs can be:

- written locally during processing
- uploaded to object storage
- stored in session metadata by object key or URL

This removes the current assumption that artifacts live at stable local absolute paths.

### Phase 4 — route cleanup for production

Update:

- artifact-serving route
- upload route
- delete flows
- cleanup logic

So they use storage/repository abstractions only.

### Phase 5 — deploy to Vercel

Required env groups:

- Neon connection string
- object storage credentials
- OpenRouter credentials
- provider selection flags

Then:

1. deploy app to Vercel
2. run database migrations
3. verify upload, analyze, session list, session details, delete flows

## Suggested environment flags

### Local

- `UPLOAD_STORAGE_PROVIDER=local`
- `SESSION_REPOSITORY_PROVIDER=local`

### Production

- `UPLOAD_STORAGE_PROVIDER=s3`
- `SESSION_REPOSITORY_PROVIDER=neon`
- `ARTIFACT_STORAGE_PROVIDER=s3`
- `DATABASE_URL=postgres://...`
- `S3_BUCKET=...`
- `S3_REGION=...`
- `S3_ENDPOINT=...` if using a non-AWS S3-compatible provider
- `S3_ACCESS_KEY_ID=...`
- `S3_SECRET_ACCESS_KEY=...`
- `S3_PUBLIC_BASE_URL=...` if artifact/object URLs should be directly renderable
- `S3_FORCE_PATH_STYLE=true` when required by the provider
- `MAX_RETAINED_RAW_VIDEOS=10`
- `RAW_VIDEO_RETENTION_DAYS=14`

## Minimum next milestone

The next deployment-oriented coding milestone should be:

1. define DB schema for Neon session storage
2. add Neon session repository adapter
3. keep local repository as fallback for dev
4. do not switch the app default yet

That gives us the first real production dependency without rewriting the media path at the same time.

## Beta checklist

This is the shortest sensible path to a real beta that your nephew can use on Vercel.

### Stage 1 — choose and wire object storage

- Pick one object storage provider:
  - Cloudflare R2
  - AWS S3
  - another S3-compatible provider
- Add a production upload-storage adapter that:
  - accepts uploaded video files
  - stores them by object key instead of local absolute path
  - returns enough metadata for analysis and deletion
- Keep the existing local upload adapter for development

Definition of done:

- Uploaded videos no longer require `data/uploads` in production
- Runtime can switch providers with env flags

Current progress:

- `lib/storage/s3/upload-storage.ts` exists as the first S3-compatible upload adapter
- upload metadata now supports `storageKey` and `publicUrl`
- processing can request a local working copy from the active upload-storage provider
- validated locally against Cloudflare R2 on 2026-04-15

### Stage 2 — move media artifacts to object storage

- Refactor artifact persistence so poster and key-frame images can be uploaded after ffmpeg extraction
- Store object keys or URLs in session metadata instead of assuming local files remain present
- Keep local artifact handling for development

Definition of done:

- Posters and key frames can render from object storage in production
- Session delete clears artifact objects as well as the session record

Current progress:

- `lib/storage/s3/artifact-storage.ts` exists as the first S3-compatible artifact adapter
- artifact route now reads through `lib/storage/artifacts.ts`
- delete flows now clear artifacts through storage abstractions instead of direct route-level file handling
- ffmpeg now writes temp artifacts for processing, then persists them through the active artifact-storage provider

### Stage 3 — finish Neon setup

- Create the real Neon database/project for the beta
- Run `db/neon/001_create_swing_sessions.sql`
- Verify the app can use `SESSION_REPOSITORY_PROVIDER=neon`
- Confirm local fallback still works when env vars are absent

Definition of done:

- Session list/details/read/write/delete all work against Neon

Current progress:

- validated locally against Neon on 2026-04-15
- direct SQL verification confirmed session rows are being written to `swing_sessions`

### Stage 4 — production route cleanup

- Remove route assumptions that files are always on the local filesystem
- Update artifact serving to use storage-backed URLs or a storage-backed fetch path
- Make delete flows remove:
  - session metadata
  - uploaded video object
  - artifact objects

Definition of done:

- No production code path depends on durable local disk

### Stage 5 — Vercel environment setup

- Add Vercel env vars for:
  - `DATABASE_URL`
  - `SESSION_REPOSITORY_PROVIDER=neon`
  - upload/artifact storage credentials
  - upload/artifact storage provider selection
  - OpenRouter credentials
- Decide whether artifact URLs are:
  - public
  - signed
  - proxied through the app

Definition of done:

- Preview and production environments both have complete config

Current blocker:

- the Vercel CLI is installed but the token in this environment is currently invalid
- next deployment step requires `vercel login` or a fresh Vercel token before env setup and deploy can continue

Suggested initial Vercel values:

- `COACHING_ANALYSIS_PROVIDER=openrouter`
- `SESSION_REPOSITORY_PROVIDER=neon`
- `UPLOAD_STORAGE_PROVIDER=s3`
- `ARTIFACT_STORAGE_PROVIDER=s3`
- `OPENROUTER_API_KEY=...`
- `OPENROUTER_MODEL=openai/gpt-4.1-mini`
- `DATABASE_URL=...`
- `S3_BUCKET=...`
- `S3_REGION=...`
- `S3_ENDPOINT=...` when using R2 or another S3-compatible provider
- `S3_ACCESS_KEY_ID=...`
- `S3_SECRET_ACCESS_KEY=...`
- `S3_PUBLIC_BASE_URL=...` when you want directly renderable object URLs
- `S3_FORCE_PATH_STYLE=true` only when required by the provider
- `MAX_RETAINED_RAW_VIDEOS=10`
- `RAW_VIDEO_RETENTION_DAYS=14`

### Stage 6 — beta verification

- Deploy to Vercel
- Verify end to end:
  - upload a swing
  - analyze it
  - open session list
  - open session details
- view poster and key frames
- rerun analysis
- delete a session
- Test on a real external device, not just localhost
- Confirm the raw-video retention policy behaves as expected once enough sessions exist

Definition of done:

- A golfer can use the hosted product without any local-machine dependency

### Stage 7 — beta feedback loop

- Give your nephew a narrow brief:
  - does the upload flow feel reliable?
  - do the images/stills help?
  - is the summary believable?
  - are the fixes and drills useful?
  - are the scores meaningful or distracting?
- Log the biggest misses before broadening the beta

Definition of done:

- We have real golfer feedback that can guide the next coaching-quality pass

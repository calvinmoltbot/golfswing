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

This still keeps uploads and artifacts on local disk, so it is only a partial production step.

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
- `DATABASE_URL=postgres://...`

Future:

- `ARTIFACT_STORAGE_PROVIDER=s3`

## Minimum next milestone

The next deployment-oriented coding milestone should be:

1. define DB schema for Neon session storage
2. add Neon session repository adapter
3. keep local repository as fallback for dev
4. do not switch the app default yet

That gives us the first real production dependency without rewriting the media path at the same time.

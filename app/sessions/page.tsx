import type { Route } from 'next';
import Link from 'next/link';
import { ClearSessionsButton, DeleteSessionButton } from '@/components/session-actions';
import { listSessions } from '@/lib/storage/sessions';

export const dynamic = 'force-dynamic';

function formatBytes(sizeBytes: number) {
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default async function SessionsPage() {
  const sessions = await listSessions();

  return (
    <main className="stack-lg">
      <section className="stack-sm">
        <Link href="/" className="muted">
          Back to upload
        </Link>
        <div className="stack-sm">
          <div className="eyebrow">Library</div>
          <h1 style={{ fontSize: 42, margin: 0 }}>Swing Sessions</h1>
          <p className="muted" style={{ maxWidth: 760 }}>
            Review recent swings, reopen coaching reports, and manage saved sessions without digging through raw debug output.
          </p>
        </div>
        <ClearSessionsButton />
      </section>

      {sessions.length === 0 ? (
        <section className="card stack-sm">
          <h2 style={{ margin: 0 }}>No sessions yet</h2>
          <p className="muted" style={{ margin: 0 }}>Upload your first swing clip from the home page.</p>
        </section>
      ) : (
        <section className="session-list">
          {sessions.map((session) => {
            const sessionHref = `/sessions/${session.id}` as Route;

            return (
              <article key={session.id} className="card session-row">
                <div>
                  {session.pipeline.mediaArtifacts?.poster ? (
                    <div className="artifact-surface list">
                      <img
                        src={session.pipeline.mediaArtifacts.poster.urlPath}
                        alt={`${session.file.originalName} poster`}
                        className="artifact-preview"
                      />
                    </div>
                  ) : (
                    <div className="artifact-surface list">
                      <div className="muted">Poster pending</div>
                    </div>
                  )}
                </div>

                <div className="session-content">
                  <div className="session-actions">
                    <div className="stack-sm">
                      <div className="eyebrow">Saved session</div>
                      <h2 style={{ margin: 0 }}>
                        <Link href={sessionHref}>{session.file.originalName}</Link>
                      </h2>
                      <p className="muted" style={{ margin: 0 }}>
                        Uploaded {formatDate(session.createdAt)}
                      </p>
                    </div>
                    <div className="pill">{session.status}</div>
                  </div>

                  <div className="meta-grid">
                    <div className="metric-tile">
                      <div className="muted">Club</div>
                      <div className="value small">{session.playerContext?.club || 'Not set'}</div>
                    </div>
                    <div className="metric-tile">
                      <div className="muted">View</div>
                      <div className="value small">{session.playerContext?.cameraView || 'Not set'}</div>
                    </div>
                    <div className="metric-tile">
                      <div className="muted">Status</div>
                      <div className="value small">{session.status}</div>
                    </div>
                    <div className="metric-tile">
                      <div className="muted">Raw video</div>
                      <div className="value small">
                        {session.file.videoStatus === 'retired' ? 'Retired' : 'Available'}
                      </div>
                    </div>
                    <div className="metric-tile">
                      <div className="muted">Clip size</div>
                      <div className="value small">{formatBytes(session.file.sizeBytes)}</div>
                    </div>
                  </div>

                  <div className="card inset prose-card">
                    <div className="muted">Latest analysis</div>
                    <p style={{ margin: 0 }}>{session.analysis?.summary || 'Analysis pending.'}</p>
                  </div>

                  {session.file.videoStatus === 'retired' ? (
                    <div className="card inset prose-card">
                      <div className="muted">Storage policy</div>
                      <p style={{ margin: 0 }}>
                        Raw video retired{session.file.retiredAt ? ` on ${formatDate(session.file.retiredAt)}` : ''}.
                        Stills and report remain available.
                      </p>
                    </div>
                  ) : null}

                  <div className="row-between start" style={{ flexWrap: 'wrap' }}>
                    <Link href={sessionHref} className="button secondary">
                      View report
                    </Link>
                    <DeleteSessionButton sessionId={session.id} />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

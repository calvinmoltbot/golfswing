import type { Route } from 'next';
import Link from 'next/link';
import { ClearSessionsButton, DeleteSessionButton } from '@/components/session-actions';
import { listSessions } from '@/lib/storage/sessions';

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
    <main className="grid" style={{ gap: 24 }}>
      <section className="grid" style={{ gap: 8 }}>
        <Link href="/" className="muted">
          Back to upload
        </Link>
        <div>
          <h1 style={{ fontSize: 36, marginBottom: 8 }}>Swing Sessions</h1>
          <p className="muted" style={{ maxWidth: 760 }}>
            Uploaded sessions persisted on the local filesystem for development. New uploads appear here immediately.
          </p>
        </div>
        <ClearSessionsButton />
      </section>

      {sessions.length === 0 ? (
        <section className="card">
          <h2>No sessions yet</h2>
          <p className="muted">Upload your first swing clip from the home page.</p>
        </section>
      ) : (
        <section className="grid">
          {sessions.map((session) => {
            const sessionHref = `/sessions/${session.id}` as Route;

            return (
              <article key={session.id} className="card grid" style={{ gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>
                      <Link href={sessionHref}>{session.file.originalName}</Link>
                    </h2>
                    <p className="muted" style={{ margin: '6px 0 0' }}>
                      Uploaded {formatDate(session.createdAt)}
                    </p>
                  </div>
                  <div className="pill">{session.status}</div>
                </div>
                <div className="grid grid-3">
                  <div className="card inset">
                    <div className="muted">Session ID</div>
                    <div className="code">{session.id}</div>
                  </div>
                  <div className="card inset">
                    <div className="muted">Format</div>
                    <div>{session.file.mimeType}</div>
                  </div>
                  <div className="card inset">
                    <div className="muted">Status</div>
                    <div>{session.status}</div>
                  </div>
                </div>
                <DeleteSessionButton sessionId={session.id} />
                {session.analysis ? (
                  <div className="card inset">
                    {session.pipeline.mediaArtifacts?.poster ? (
                      <img
                        src={session.pipeline.mediaArtifacts.poster.urlPath}
                        alt={`${session.file.originalName} poster`}
                        className="artifact-preview"
                      />
                    ) : null}
                    <div className="muted" style={{ marginBottom: 8 }}>
                      Latest analysis
                    </div>
                    <p style={{ margin: 0 }}>{session.analysis.summary}</p>
                    <p style={{ margin: '10px 0 0' }}>
                      <Link href={sessionHref} className="muted">
                        View full session details
                      </Link>
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

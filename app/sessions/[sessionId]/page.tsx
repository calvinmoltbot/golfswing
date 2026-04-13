import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readSession } from '@/lib/storage/sessions';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default async function SessionDetailsPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await readSession(sessionId);

  if (!session) {
    notFound();
  }

  return (
    <main className="grid" style={{ gap: 24 }}>
      <section className="grid" style={{ gap: 8 }}>
        <Link href="/sessions" className="muted">
          Back to sessions
        </Link>
        <div>
          <h1 style={{ fontSize: 36, marginBottom: 8 }}>{session.file.originalName}</h1>
          <p className="muted">
            Session {session.id} • Uploaded {formatDate(session.createdAt)} • Status {session.status}
          </p>
        </div>
      </section>

      <section className="grid grid-2">
        <article className="card grid" style={{ gap: 12 }}>
          <h2 style={{ margin: 0 }}>Session metadata</h2>
          <div className="grid grid-2">
            <div className="card inset">
              <div className="muted">Video path</div>
              <div className="code break">{session.file.absolutePath}</div>
            </div>
            <div className="card inset">
              <div className="muted">Updated</div>
              <div>{formatDate(session.updatedAt)}</div>
            </div>
            <div className="card inset">
              <div className="muted">Camera view</div>
              <div>{session.playerContext?.cameraView || 'Not set'}</div>
            </div>
            <div className="card inset">
              <div className="muted">Club</div>
              <div>{session.playerContext?.club || 'Not set'}</div>
            </div>
          </div>
          <div className="card inset">
            <div className="muted">Notes</div>
            <p style={{ marginBottom: 0 }}>{session.notes || 'No player notes.'}</p>
          </div>
        </article>

        <article className="card grid" style={{ gap: 12 }}>
          <h2 style={{ margin: 0 }}>Analysis</h2>
          {session.analysis ? (
            <>
              <div className="card inset">
                <div className="muted">Summary</div>
                <p style={{ marginBottom: 0 }}>{session.analysis.summary}</p>
              </div>
              <div className="card inset">
                <div className="muted">Priority fixes</div>
                <ul>
                  {session.analysis.priorityFixes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="card inset">
              <p style={{ margin: 0 }}>No analysis saved yet.</p>
            </div>
          )}
        </article>
      </section>

      <section className="grid grid-2">
        <article className="card grid" style={{ gap: 12 }}>
          <h2 style={{ margin: 0 }}>Pose estimation</h2>
          {session.pipeline.poseEstimation ? (
            <>
              <div className="grid grid-3">
                <div className="card inset">
                  <div className="muted">Provider</div>
                  <div>{session.pipeline.poseEstimation.provider.id}</div>
                </div>
                <div className="card inset">
                  <div className="muted">Version</div>
                  <div>{session.pipeline.poseEstimation.provider.version}</div>
                </div>
                <div className="card inset">
                  <div className="muted">Frames</div>
                  <div>{session.pipeline.poseEstimation.keypointFrames.length}</div>
                </div>
              </div>
              <div className="card inset">
                <div className="muted">Metrics</div>
                <pre className="code prewrap">{JSON.stringify(session.pipeline.poseEstimation.metrics, null, 2)}</pre>
              </div>
              <div className="card inset">
                <div className="muted">Keypoints</div>
                <pre className="code prewrap">{JSON.stringify(session.pipeline.poseEstimation.keypointFrames, null, 2)}</pre>
              </div>
            </>
          ) : (
            <div className="card inset">
              <p style={{ margin: 0 }}>No pose-estimation artifacts saved yet.</p>
            </div>
          )}
        </article>

        <article className="card grid" style={{ gap: 12 }}>
          <h2 style={{ margin: 0 }}>Phase detection</h2>
          {session.pipeline.phases ? (
            <div className="card inset">
              <pre className="code prewrap">{JSON.stringify(session.pipeline.phases, null, 2)}</pre>
            </div>
          ) : (
            <div className="card inset">
              <p style={{ margin: 0 }}>No phase timings saved yet.</p>
            </div>
          )}
          {session.error ? (
            <div className="card inset">
              <div className="muted">Last error</div>
              <p style={{ marginBottom: 0 }}>{session.error}</p>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  );
}

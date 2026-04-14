import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReanalyzeButton } from '@/components/reanalyze-button';
import { DeleteSessionButton } from '@/components/session-actions';
import { readSession } from '@/lib/storage/sessions';
import type { PoseMetrics, SwingPhaseDetection } from '@/types/analysis';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatSeconds(timestampMs: number) {
  return `${(timestampMs / 1000).toFixed(2)}s`;
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card inset">
      <div className="muted">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function PoseMetricsSection({ metrics }: { metrics: PoseMetrics }) {
  return (
    <>
      <div className="grid grid-3">
        <MetricCard label="FPS" value={metrics.fps} />
        <MetricCard label="Duration" value={formatSeconds(metrics.durationMs)} />
        <MetricCard label="Tempo ratio" value={metrics.measurements.tempoRatio.toFixed(1)} />
        <MetricCard label="Head drift" value={`${metrics.measurements.headDriftPx}px`} />
        <MetricCard label="Pelvis shift" value={`${metrics.measurements.pelvisShiftPx}px`} />
        <MetricCard label="Shaft lean" value={`${metrics.measurements.shaftLeanAtImpactDeg}°`} />
        <MetricCard label="Shoulder turn" value={`${metrics.measurements.shoulderTurnDeg}°`} />
        <MetricCard label="Hip turn" value={`${metrics.measurements.hipTurnDeg}°`} />
        <MetricCard label="Lead knee flex" value={`${metrics.measurements.leadKneeFlexChangeDeg}°`} />
      </div>
    </>
  );
}

function PhaseList({ phases }: { phases: SwingPhaseDetection }) {
  const orderedPhases = [
    ['Address', phases.addressMs],
    ['Takeaway', phases.takeawayMs],
    ['Top', phases.topMs],
    ['Transition', phases.transitionMs],
    ['Impact', phases.impactMs],
    ['Finish', phases.finishMs]
  ] as const;

  return (
    <div className="grid">
      {orderedPhases.map(([label, value]) => (
        <div key={label} className="row-between">
          <span className="muted">{label}</span>
          <span>{formatSeconds(value)}</span>
        </div>
      ))}
    </div>
  );
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
          <p className="muted">
            Current stage: {session.pipeline.currentStage}
            {session.pipeline.failedStage ? ` • Failed at: ${session.pipeline.failedStage}` : ''}
          </p>
        </div>
      </section>

      <section className="grid grid-2">
        <article className="card grid" style={{ gap: 12 }}>
          <h2 style={{ margin: 0 }}>Session metadata</h2>
          <div className="grid grid-2">
            <MetricCard label="Updated" value={formatDate(session.updatedAt)} />
            <MetricCard label="Camera view" value={session.playerContext?.cameraView || 'Not set'} />
            <MetricCard label="Club" value={session.playerContext?.club || 'Not set'} />
            <MetricCard label="Report mode" value={session.reportMode} />
            <MetricCard label="Skill band" value={session.skillBand} />
            <MetricCard label="Clip size" value={`${(session.file.sizeBytes / (1024 * 1024)).toFixed(2)} MB`} />
          </div>
          <div className="card inset">
            <div className="muted">Notes</div>
            <p style={{ marginBottom: 0 }}>{session.notes || 'No player notes.'}</p>
          </div>
          <div className="grid grid-3">
            <MetricCard label="Primary goal" value={session.playerGoal || 'Not set'} />
            <MetricCard label="Usual miss" value={session.usualMiss || 'Not set'} />
            <MetricCard label="Shot shape" value={session.shotShape || 'Not set'} />
          </div>
          <ReanalyzeButton
            sessionId={session.id}
            initialNotes={session.notes}
            initialPlayerContext={session.playerContext}
            initialReportMode={session.reportMode}
            initialPlayerGoal={session.playerGoal}
            initialUsualMiss={session.usualMiss}
            initialShotShape={session.shotShape}
            initialSkillBand={session.skillBand}
          />
          <DeleteSessionButton sessionId={session.id} redirectTo="/sessions" />
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
                <div className="muted">Primary finding</div>
                <p style={{ marginBottom: 8 }}>
                  <strong>{session.analysis.primaryFinding.title}</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>{session.analysis.primaryFinding.detail}</p>
                <p className="muted" style={{ margin: 0 }}>{session.analysis.primaryFinding.impact}</p>
              </div>
              <div className="card inset">
                <div className="muted">Priority fixes</div>
                <ul>
                  {session.analysis.priorityFixes.map((item) => (
                    <li key={item.title}>
                      <strong>{item.title}:</strong> {item.detail}
                      <div className="muted" style={{ marginTop: 4 }}>{item.evidence}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card inset">
                <div className="muted">Measurable checkpoint</div>
                <p style={{ marginBottom: 8 }}>
                  <strong>{session.analysis.measurableCheckpoint.label}</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>{session.analysis.measurableCheckpoint.target}</p>
                <p className="muted" style={{ margin: 0 }}>{session.analysis.measurableCheckpoint.whyItMatters}</p>
              </div>
              <div className="card inset">
                <div className="muted">Drills</div>
                <ul>
                  {session.analysis.drills.map((item) => (
                    <li key={item.name}>
                      <strong>{item.name}:</strong> {item.reason}
                      <div className="muted" style={{ marginTop: 4 }}>Checkpoint: {item.checkpoint}</div>
                    </li>
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
                <MetricCard label="Provider" value={session.pipeline.poseEstimation.provider.id} />
                <MetricCard label="Version" value={session.pipeline.poseEstimation.provider.version} />
                <MetricCard label="Frames" value={session.pipeline.poseEstimation.keypointFrames.length} />
              </div>
              <div className="card inset">
                <div className="muted">Metrics</div>
                <PoseMetricsSection metrics={session.pipeline.poseEstimation.metrics} />
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
              <PhaseList phases={session.pipeline.phases} />
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

      <section className="card grid" style={{ gap: 12 }}>
        <h2 style={{ margin: 0 }}>Coaching analysis</h2>
        {session.pipeline.coachingAnalysis ? (
          <div className="grid grid-3">
            <MetricCard label="Provider" value={session.pipeline.coachingAnalysis.providerId} />
            <MetricCard label="Model" value={session.pipeline.coachingAnalysis.model} />
            <MetricCard
              label="Requested"
              value={formatDate(session.pipeline.coachingAnalysis.requestedAt)}
            />
            <MetricCard
              label="Completed"
              value={
                session.pipeline.coachingAnalysis.completedAt
                  ? formatDate(session.pipeline.coachingAnalysis.completedAt)
                  : 'Not completed'
              }
            />
            <MetricCard
              label="Validation"
              value={session.pipeline.coachingAnalysis.validationError ? 'Failed' : 'Passed'}
            />
          </div>
        ) : (
          <div className="card inset">
            <p style={{ margin: 0 }}>No coaching-analysis metadata saved yet.</p>
          </div>
        )}
        {session.pipeline.coachingAnalysis?.validationError ? (
          <div className="card inset">
            <div className="muted">Validation or provider error</div>
            <p style={{ marginBottom: 0 }}>{session.pipeline.coachingAnalysis.validationError}</p>
          </div>
        ) : null}
      </section>

      <section className="card grid" style={{ gap: 12 }}>
        <h2 style={{ margin: 0 }}>Media artifacts</h2>
        {session.pipeline.mediaArtifacts ? (
          <>
            <div className="grid grid-3">
              <div className="card inset">
                <div className="muted">Provider</div>
                <div>{session.pipeline.mediaArtifacts.provider.id}</div>
              </div>
              <div className="card inset">
                <div className="muted">Version</div>
                <div>{session.pipeline.mediaArtifacts.provider.version}</div>
              </div>
              <div className="card inset">
                <div className="muted">Key frames</div>
                <div>{session.pipeline.mediaArtifacts.keyFrames.length}</div>
              </div>
            </div>
            {session.pipeline.mediaArtifacts.poster ? (
              <div className="card inset">
                <div className="muted" style={{ marginBottom: 8 }}>Poster</div>
                <div className="artifact-surface detail">
                  <img
                    src={session.pipeline.mediaArtifacts.poster.urlPath}
                    alt={`${session.file.originalName} poster`}
                    className="artifact-preview"
                  />
                </div>
              </div>
            ) : null}
            <div className="artifact-grid">
              {session.pipeline.mediaArtifacts.keyFrames.map((artifact) => (
                <div key={artifact.fileName} className="card inset artifact-card">
                  <div className="muted">{artifact.label || artifact.type}</div>
                  <div className="artifact-surface compact">
                    <img
                      src={artifact.urlPath}
                      alt={`${session.file.originalName} ${artifact.label || artifact.type}`}
                      className="artifact-preview"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="card inset">
            <p style={{ margin: 0 }}>No media artifacts saved yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}

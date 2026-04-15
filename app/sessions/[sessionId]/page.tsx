import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReanalyzeButton } from '@/components/reanalyze-button';
import { DeleteSessionButton } from '@/components/session-actions';
import { readSession } from '@/lib/storage/sessions';
import type { PoseMetrics, SwingPhaseDetection } from '@/types/analysis';
import type { MediaArtifact } from '@/types/media-artifacts';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatSeconds(timestampMs: number) {
  return `${(timestampMs / 1000).toFixed(2)}s`;
}

function MetricTile({ label, value, small = false }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="metric-tile">
      <div className="muted">{label}</div>
      <div className={`value${small ? ' small' : ''}`}>{value}</div>
    </div>
  );
}

function PoseMetricsSection({ metrics }: { metrics: PoseMetrics }) {
  return (
    <div className="meta-grid">
      <MetricTile label="FPS" value={metrics.fps} />
      <MetricTile label="Duration" value={formatSeconds(metrics.durationMs)} />
      <MetricTile label="Tempo ratio" value={metrics.measurements.tempoRatio.toFixed(1)} />
      <MetricTile label="Head drift" value={`${metrics.measurements.headDriftPx}px`} />
      <MetricTile label="Pelvis shift" value={`${metrics.measurements.pelvisShiftPx}px`} />
      <MetricTile label="Shaft lean" value={`${metrics.measurements.shaftLeanAtImpactDeg}°`} />
      <MetricTile label="Shoulder turn" value={`${metrics.measurements.shoulderTurnDeg}°`} />
      <MetricTile label="Hip turn" value={`${metrics.measurements.hipTurnDeg}°`} />
      <MetricTile label="Lead knee flex" value={`${metrics.measurements.leadKneeFlexChangeDeg}°`} />
    </div>
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
    <div className="timeline-list">
      {orderedPhases.map(([label, value]) => (
        <div key={label} className="timeline-row">
          <span className="muted">{label}</span>
          <strong>{formatSeconds(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function KeyFrameCard({
  artifact,
  fileName
}: {
  artifact: MediaArtifact;
  fileName: string;
}) {
  return (
    <div className="card inset artifact-card">
      <div className="artifact-label">{artifact.label || artifact.type}</div>
      <div className="artifact-surface compact">
        <img
          src={artifact.urlPath}
          alt={`${fileName} ${artifact.label || artifact.type}`}
          className="artifact-preview"
        />
      </div>
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
    <main className="stack-lg">
      <section className="stack-sm">
        <Link href="/sessions" className="muted">
          Back to sessions
        </Link>
        <div className="stack-sm">
          <div className="eyebrow">Session report</div>
          <h1 style={{ fontSize: 42, margin: 0 }}>{session.file.originalName}</h1>
          <div className="session-meta-bar">
            <span className="pill">Uploaded {formatDate(session.createdAt)}</span>
            <span className="pill">Status {session.status}</span>
            <span className="pill">Stage {session.pipeline.currentStage}</span>
            {session.playerContext?.club ? <span className="pill">{session.playerContext.club}</span> : null}
            {session.playerContext?.cameraView ? <span className="pill">{session.playerContext.cameraView}</span> : null}
          </div>
        </div>
      </section>

      <section className="session-hero">
        <article className="card artifact-panel">
          <div className="row-between start" style={{ flexWrap: 'wrap' }}>
            <div className="stack-sm">
              <div className="eyebrow">Visual review</div>
              <h2 className="section-title">Poster and key positions</h2>
            </div>
            {session.pipeline.mediaArtifacts ? (
              <div className="pill">
                {session.pipeline.mediaArtifacts.provider.id} · {session.pipeline.mediaArtifacts.keyFrames.length} frames
              </div>
            ) : null}
          </div>

          {session.pipeline.mediaArtifacts?.poster ? (
            <div className="artifact-surface detail">
              <img
                src={session.pipeline.mediaArtifacts.poster.urlPath}
                alt={`${session.file.originalName} poster`}
                className="artifact-preview"
              />
            </div>
          ) : (
            <div className="card inset">
              <p style={{ margin: 0 }}>Poster not generated yet.</p>
            </div>
          )}

          {session.pipeline.mediaArtifacts?.keyFrames?.length ? (
            <div className="artifact-grid">
              {session.pipeline.mediaArtifacts.keyFrames.map((artifact) => (
                <KeyFrameCard key={artifact.fileName} artifact={artifact} fileName={session.file.originalName} />
              ))}
            </div>
          ) : null}
        </article>

        <article className="card stack-lg summary">
          <div className="stack-sm">
            <div className="eyebrow">Coach summary</div>
            <h2 className="section-title">What matters most</h2>
          </div>

          {session.analysis ? (
            <>
              <div className="coach-band stack-sm">
                <div className="muted">Summary</div>
                <p style={{ margin: 0, fontSize: 18, lineHeight: 1.6 }}>{session.analysis.summary}</p>
              </div>

              <div className="card inset prose-card callout">
                <div className="muted">Primary finding</div>
                <strong>{session.analysis.primaryFinding.title}</strong>
                <p style={{ margin: 0 }}>{session.analysis.primaryFinding.detail}</p>
                <p className="muted" style={{ margin: 0 }}>{session.analysis.primaryFinding.impact}</p>
              </div>

              {session.analysis.issueTaxonomy.length ? (
                <div className="card inset prose-card">
                  <div className="muted">Recurring issue tags</div>
                  <ul className="bullet-list">
                    {session.analysis.issueTaxonomy.map((issue) => (
                      <li key={issue.code}>
                        <strong>{issue.label}</strong>
                        <div className="muted">
                          {issue.severity} severity · {issue.evidence}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="card inset prose-card">
                <div className="muted">Measurable checkpoint</div>
                <strong>{session.analysis.measurableCheckpoint.label}</strong>
                <p style={{ margin: 0 }}>{session.analysis.measurableCheckpoint.target}</p>
                <p className="muted" style={{ margin: 0 }}>{session.analysis.measurableCheckpoint.whyItMatters}</p>
              </div>

              <div className="supporting-copy">
                Use the key-frame stills to confirm the move visually, then train only the first fix until the checkpoint starts to feel repeatable.
              </div>
            </>
          ) : (
            <div className="card inset">
              <p style={{ margin: 0 }}>No analysis saved yet.</p>
            </div>
          )}

          <div className="stack-md">
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
          </div>
        </article>
      </section>

      <section className="session-report-grid">
        <article className="card stack-lg">
          <div className="stack-sm">
            <div className="eyebrow">Practice plan</div>
            <h2 className="section-title">What to work on next</h2>
          </div>

          {session.analysis ? (
            <>
              <div className="card inset prose-card">
                <div className="muted">Priority fixes</div>
                <ul className="bullet-list">
                  {session.analysis.priorityFixes.map((item) => (
                    <li key={item.title}>
                      <strong>{item.title}</strong>
                      <div>{item.detail}</div>
                      <div className="muted">{item.evidence}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card inset prose-card">
                <div className="muted">Drills</div>
                <ul className="bullet-list">
                  {session.analysis.drills.map((item) => (
                    <li key={item.name}>
                      <strong>{item.name}</strong>
                      <div>{item.reason}</div>
                      <div className="muted">Checkpoint: {item.checkpoint}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="card inset">
              <p style={{ margin: 0 }}>No coaching recommendations saved yet.</p>
            </div>
          )}
        </article>

        <article className="card stack-lg">
          <div className="stack-sm">
            <div className="eyebrow">Player context</div>
            <h2 className="section-title">What this report is based on</h2>
          </div>

          <div className="meta-grid">
            <MetricTile label="Updated" value={formatDate(session.updatedAt)} small />
            <MetricTile label="Club" value={session.playerContext?.club || 'Not set'} small />
            <MetricTile label="Camera view" value={session.playerContext?.cameraView || 'Not set'} small />
            <MetricTile label="Report mode" value={session.reportMode} small />
            <MetricTile label="Skill band" value={session.skillBand} small />
            <MetricTile label="Clip size" value={`${(session.file.sizeBytes / (1024 * 1024)).toFixed(2)} MB`} small />
          </div>

          <div className="card inset prose-card">
            <div className="muted">Player notes</div>
            <p style={{ margin: 0 }}>{session.notes || 'No player notes.'}</p>
          </div>

          <div className="meta-grid">
            <MetricTile label="Primary goal" value={session.playerGoal || 'Not set'} small />
            <MetricTile label="Usual miss" value={session.usualMiss || 'Not set'} small />
            <MetricTile label="Shot shape" value={session.shotShape || 'Not set'} small />
          </div>
        </article>
      </section>

      <section>
        <details className="disclosure">
          <summary>
            <span>Diagnostics and pipeline details</span>
          </summary>
          <div className="disclosure-body">
            <section className="session-report-grid">
              <article className="card stack-lg">
                <div className="stack-sm">
                  <div className="eyebrow">Motion data</div>
                  <h2 className="section-title">Pose and timing</h2>
                </div>

                {session.pipeline.poseEstimation ? (
                  <>
                    <div className="meta-grid">
                      <MetricTile label="Provider" value={session.pipeline.poseEstimation.provider.id} small />
                      <MetricTile label="Version" value={session.pipeline.poseEstimation.provider.version} small />
                      <MetricTile label="Frames" value={session.pipeline.poseEstimation.keypointFrames.length} small />
                    </div>
                    <PoseMetricsSection metrics={session.pipeline.poseEstimation.metrics} />
                  </>
                ) : (
                  <div className="card inset">
                    <p style={{ margin: 0 }}>No pose-estimation artifacts saved yet.</p>
                  </div>
                )}
              </article>

              <article className="card stack-lg">
                <div className="stack-sm">
                  <div className="eyebrow">Pipeline</div>
                  <h2 className="section-title">Phase timing and model metadata</h2>
                </div>

                {session.pipeline.phases ? (
                  <div className="card inset">
                    <PhaseList phases={session.pipeline.phases} />
                  </div>
                ) : (
                  <div className="card inset">
                    <p style={{ margin: 0 }}>No phase timings saved yet.</p>
                  </div>
                )}

                {session.pipeline.coachingAnalysis ? (
                  <div className="meta-grid">
                    <MetricTile label="Provider" value={session.pipeline.coachingAnalysis.providerId} small />
                    <MetricTile label="Model" value={session.pipeline.coachingAnalysis.model} small />
                    <MetricTile label="Requested" value={formatDate(session.pipeline.coachingAnalysis.requestedAt)} small />
                    <MetricTile
                      label="Completed"
                      value={
                        session.pipeline.coachingAnalysis.completedAt
                          ? formatDate(session.pipeline.coachingAnalysis.completedAt)
                          : 'Not completed'
                      }
                      small
                    />
                    <MetricTile
                      label="Validation"
                      value={session.pipeline.coachingAnalysis.validationError ? 'Failed' : 'Passed'}
                      small
                    />
                  </div>
                ) : null}

                {session.pipeline.failedStage ? (
                  <div className="card inset prose-card">
                    <div className="muted">Failed stage</div>
                    <p style={{ margin: 0 }}>{session.pipeline.failedStage}</p>
                  </div>
                ) : null}

                {session.pipeline.coachingAnalysis?.validationError ? (
                  <div className="card inset prose-card">
                    <div className="muted">Validation or provider error</div>
                    <p style={{ margin: 0 }}>{session.pipeline.coachingAnalysis.validationError}</p>
                  </div>
                ) : null}

                {session.error ? (
                  <div className="card inset prose-card">
                    <div className="muted">Last error</div>
                    <p style={{ margin: 0 }}>{session.error}</p>
                  </div>
                ) : null}
              </article>
            </section>
          </div>
        </details>
      </section>
    </main>
  );
}

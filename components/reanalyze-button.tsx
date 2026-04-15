'use client';

import { useState } from 'react';
import type { SwingAnalysisRequest, SwingAnalysisResponse } from '@/types/analysis';

export function ReanalyzeButton({
  sessionId,
  initialNotes,
  initialPlayerContext,
  initialReportMode,
  initialPlayerGoal,
  initialUsualMiss,
  initialShotShape,
  initialSkillBand,
  rawVideoAvailable,
  retiredAt
}: {
  sessionId: string;
  initialNotes: string;
  initialPlayerContext: SwingAnalysisRequest['playerContext'] | null;
  initialReportMode: SwingAnalysisRequest['reportMode'];
  initialPlayerGoal: string;
  initialUsualMiss: string;
  initialShotShape: string;
  initialSkillBand: SwingAnalysisRequest['skillBand'];
  rawVideoAvailable: boolean;
  retiredAt: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (!rawVideoAvailable) {
      setError(
        retiredAt
          ? `The raw swing video was retired on ${new Date(retiredAt).toLocaleDateString('en-GB')} to control storage costs.`
          : 'The raw swing video is no longer available for reruns.'
      );
      return;
    }

    if (!initialPlayerContext) {
      setError('Set player context before rerunning analysis.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/reanalyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: initialNotes,
          playerContext: initialPlayerContext,
          reportMode: initialReportMode,
          playerGoal: initialPlayerGoal,
          usualMiss: initialUsualMiss,
          shotShape: initialShotShape,
          skillBand: initialSkillBand
        } satisfies Omit<SwingAnalysisRequest, 'sessionId'>)
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || `Request failed: ${response.status}`);
      }

      await response.json() as SwingAnalysisResponse;
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 8 }}>
      <button
        className="button secondary"
        type="button"
        onClick={onClick}
        disabled={loading || !rawVideoAvailable}
      >
        {loading ? 'Reanalyzing…' : rawVideoAvailable ? 'Reanalyze session' : 'Raw video retired'}
      </button>
      {!rawVideoAvailable ? (
        <div className="muted">
          The saved report and stills remain available, but rerunning analysis requires a fresh upload.
        </div>
      ) : null}
      {error ? <div className="muted">{error}</div> : null}
    </div>
  );
}

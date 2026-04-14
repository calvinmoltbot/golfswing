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
  initialSkillBand
}: {
  sessionId: string;
  initialNotes: string;
  initialPlayerContext: SwingAnalysisRequest['playerContext'] | null;
  initialReportMode: SwingAnalysisRequest['reportMode'];
  initialPlayerGoal: string;
  initialUsualMiss: string;
  initialShotShape: string;
  initialSkillBand: SwingAnalysisRequest['skillBand'];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
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
      <button className="button secondary" type="button" onClick={onClick} disabled={loading}>
        {loading ? 'Reanalyzing…' : 'Reanalyze session'}
      </button>
      {error ? <div className="muted">{error}</div> : null}
    </div>
  );
}

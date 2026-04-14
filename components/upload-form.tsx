'use client';

import { useState } from 'react';
import type { SwingAnalysisRequest, SwingAnalysisResponse } from '@/types/analysis';
import type { UploadedSwingSession } from '@/types/session';

const clubOptions = [
  'Driver',
  '3-wood',
  '5-wood',
  '3-hybrid',
  '4-hybrid',
  '3-iron',
  '4-iron',
  '5-iron',
  '6-iron',
  '7-iron',
  '8-iron',
  '9-iron',
  'Pitching wedge',
  'Gap wedge',
  'Sand wedge',
  'Lob wedge'
] as const;

const phaseLabels: Record<keyof SwingAnalysisResponse['phaseObservations'], string> = {
  address: 'Address',
  backswing: 'Backswing',
  top: 'Top',
  transition: 'Transition',
  impact: 'Impact',
  finish: 'Finish'
};

export function UploadForm() {
  const [notes, setNotes] = useState('');
  const [playerContext, setPlayerContext] = useState<SwingAnalysisRequest['playerContext']>({
    handedness: 'right',
    cameraView: 'down-the-line',
    club: '7-iron'
  });
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [session, setSession] = useState<UploadedSwingSession | null>(null);
  const [result, setResult] = useState<SwingAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setLoadingLabel('Uploading…');
    setError(null);
    setSession(null);
    setResult(null);

    try {
      const uploadResponse = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const body = (await uploadResponse.json()) as { error?: string };
        throw new Error(body.error || `Request failed: ${uploadResponse.status}`);
      }

      const uploadData = (await uploadResponse.json()) as { session: UploadedSwingSession };
      setSession(uploadData.session);

      setLoadingLabel('Analyzing…');
      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: uploadData.session.id,
          notes,
          playerContext
        } satisfies SwingAnalysisRequest)
      });

      if (!analysisResponse.ok) {
        const body = (await analysisResponse.json()) as { error?: string };
        throw new Error(body.error || `Request failed: ${analysisResponse.status}`);
      }

      const analysis = (await analysisResponse.json()) as SwingAnalysisResponse;
      setResult(analysis);
      form.reset();
      setNotes('');
      setPlayerContext({
        handedness: 'right',
        cameraView: 'down-the-line',
        club: '7-iron'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingLabel(null);
    }
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
        <label>
          <div style={{ marginBottom: 6 }}>Swing clip</div>
          <input className="input" type="file" name="file" accept="video/mp4,video/quicktime,video/webm" required />
        </label>
        <div className="grid grid-3">
          <label>
            <div style={{ marginBottom: 6 }}>Handedness</div>
            <select
              className="input"
              value={playerContext.handedness}
              onChange={(event) =>
                setPlayerContext((current) => ({ ...current, handedness: event.target.value as 'right' | 'left' }))
              }
            >
              <option value="right">Right-handed</option>
              <option value="left">Left-handed</option>
            </select>
          </label>
          <label>
            <div style={{ marginBottom: 6 }}>Camera view</div>
            <select
              className="input"
              value={playerContext.cameraView}
              onChange={(event) =>
                setPlayerContext((current) => ({
                  ...current,
                  cameraView: event.target.value as 'down-the-line' | 'face-on'
                }))
              }
            >
              <option value="down-the-line">Down the line</option>
              <option value="face-on">Face on</option>
            </select>
          </label>
          <label>
            <div style={{ marginBottom: 6 }}>Club</div>
            <select
              className="input"
              value={playerContext.club}
              onChange={(event) => setPlayerContext((current) => ({ ...current, club: event.target.value }))}
            >
              {clubOptions.map((club) => (
                <option key={club} value={club}>
                  {club}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <div style={{ marginBottom: 6 }}>Player notes</div>
          <textarea
            className="textarea"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Example: trying to stop slicing, feel stuck at impact, miss is weak right"
          />
        </label>
        <button className="button" type="submit" disabled={loadingLabel !== null}>
          {loadingLabel || 'Upload and analyze'}
        </button>
      </form>

      {error ? <div className="card">Error: {error}</div> : null}

      {session ? (
        <div className="card">
          <h3>Uploaded session</h3>
          <p>{session.fileName}</p>
          <p className="muted">
            Session {session.id} • {(session.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {session.status}
          </p>
        </div>
      ) : null}

      {result ? (
        <div className="grid grid-4">
          <div className="card">
            <h3>Summary</h3>
            <p>{result.summary}</p>
            <p className="muted">Confidence: {result.confidence}</p>
            <div className="card inset" style={{ marginTop: 12 }}>
              <div className="muted">Primary finding</div>
              <p style={{ marginBottom: 8 }}>
                <strong>{result.primaryFinding.title}</strong>
              </p>
              <p style={{ margin: '0 0 8px' }}>{result.primaryFinding.detail}</p>
              <p className="muted" style={{ margin: 0 }}>{result.primaryFinding.impact}</p>
            </div>
          </div>
          <div className="card">
            <h3>Priority fixes</h3>
            <ul>
              {result.priorityFixes.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}:</strong> {item.detail}
                  <div className="muted" style={{ marginTop: 4 }}>{item.evidence}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Phase observations</h3>
            <div className="grid" style={{ gap: 10 }}>
              {Object.entries(result.phaseObservations).map(([phase, observation]) => (
                <div key={phase} className="row-between start">
                  <strong>{phaseLabels[phase as keyof typeof phaseLabels]}</strong>
                  <div className="muted align-right" style={{ maxWidth: 360 }}>
                    {observation}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>Drills</h3>
            <ul>
              {result.drills.map((item) => (
                <li key={item.name}>
                  <strong>{item.name}:</strong> {item.reason}
                  <div className="muted" style={{ marginTop: 4 }}>Checkpoint: {item.checkpoint}</div>
                </li>
              ))}
            </ul>
            <div className="card inset" style={{ marginTop: 12 }}>
              <div className="muted">Measurable checkpoint</div>
              <p style={{ marginBottom: 8 }}>
                <strong>{result.measurableCheckpoint.label}</strong>
              </p>
              <p style={{ margin: '0 0 8px' }}>{result.measurableCheckpoint.target}</p>
              <p className="muted" style={{ margin: 0 }}>{result.measurableCheckpoint.whyItMatters}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

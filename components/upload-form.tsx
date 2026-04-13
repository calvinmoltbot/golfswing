'use client';

import { useState } from 'react';
import type { UploadedSwingSession } from '@/types/session';

export function UploadForm() {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<UploadedSwingSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setLoading(true);
    setError(null);
    setSession(null);

    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || `Request failed: ${response.status}`);
      }

      const data = (await response.json()) as { session: UploadedSwingSession };
      setSession(data.session);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
        <label>
          <div style={{ marginBottom: 6 }}>Swing clip</div>
          <input className="input" type="file" name="file" accept="video/mp4,video/quicktime,video/webm" required />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Uploading…' : 'Upload swing'}
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
    </div>
  );
}

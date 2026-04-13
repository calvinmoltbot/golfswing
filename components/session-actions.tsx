'use client';

import { useState, useTransition } from 'react';

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    const confirmed = window.confirm('Delete this session and its saved artifacts?');

    if (!confirmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error || `Request failed: ${response.status}`);
        }

        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    });
  }

  return (
    <div className="grid" style={{ gap: 6 }}>
      <button className="button secondary danger" type="button" onClick={onDelete} disabled={isPending}>
        {isPending ? 'Deleting…' : 'Delete session'}
      </button>
      {error ? <div className="muted">{error}</div> : null}
    </div>
  );
}

export function ClearSessionsButton() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onClear() {
    const confirmed = window.confirm('Delete all sessions, uploads, and derived artifacts?');

    if (!confirmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/sessions', { method: 'DELETE' });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    });
  }

  return (
    <div className="grid" style={{ gap: 6 }}>
      <button className="button secondary danger" type="button" onClick={onClear} disabled={isPending}>
        {isPending ? 'Clearing…' : 'Clear all sessions'}
      </button>
      {error ? <div className="muted">{error}</div> : null}
    </div>
  );
}

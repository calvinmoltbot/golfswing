'use client';

import type { Route } from 'next';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteSessionButton({
  sessionId,
  redirectTo
}: {
  sessionId: string;
  redirectTo?: Route;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
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
  const router = useRouter();

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
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error || `Request failed: ${response.status}`);
        }

        router.refresh();
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

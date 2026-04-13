import Link from 'next/link';
import { UploadForm } from '@/components/upload-form';

export default function HomePage() {
  return (
    <main className="grid" style={{ gap: 24 }}>
      <section>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>Golf Swing Analyzer</h1>
        <p className="muted" style={{ maxWidth: 760 }}>
          Starter app for analyzing golf swing video with a hybrid pipeline: deterministic motion extraction,
          model-based video understanding, and structured coaching feedback.
        </p>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <h2>Current flow</h2>
          <ol>
            <li>Upload a swing video</li>
            <li>Run preprocessing and metric extraction</li>
            <li>Send structured input to OpenRouter</li>
            <li>Return coaching feedback and flags</li>
          </ol>
        </div>

        <div className="card">
          <h2>MVP focus</h2>
          <ul>
            <li>Single video upload</li>
            <li>One-view swing analysis</li>
            <li>Address / backswing / top / impact / finish phases</li>
            <li>Structured observations and drills</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Analyze a swing</h2>
          <Link href="/sessions" className="button secondary">
            View sessions
          </Link>
        </div>
        <UploadForm />
      </section>
    </main>
  );
}

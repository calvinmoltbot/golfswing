import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Golf Swing Analyzer',
  description: 'Analyze golf swing video with a hybrid vision and coaching pipeline.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

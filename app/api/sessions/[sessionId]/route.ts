import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/storage/sessions';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const deleted = await deleteSession(sessionId);

  if (!deleted) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

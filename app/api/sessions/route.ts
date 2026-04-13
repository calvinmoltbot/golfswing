import { NextResponse } from 'next/server';
import { deleteAllSessions } from '@/lib/storage/sessions';

export async function DELETE() {
  await deleteAllSessions();
  return NextResponse.json({ ok: true });
}

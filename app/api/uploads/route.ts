import { NextResponse } from 'next/server';
import path from 'node:path';
import { persistUpload } from '@/lib/storage/uploads';
import { createUploadedSession, toUploadedSwingSession } from '@/lib/storage/sessions';

const allowedMimeTypes = new Set(['video/mp4', 'video/quicktime', 'video/webm']);
const allowedExtensions = new Set(['.mp4', '.mov', '.webm']);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const maybeFile = formData.get('file');

    if (!(maybeFile instanceof File)) {
      throw new Error('A video file is required.');
    }

    const extension = path.extname(maybeFile.name).toLowerCase();
    const looksLikeAllowedVideo = allowedMimeTypes.has(maybeFile.type) || allowedExtensions.has(extension);

    if (!looksLikeAllowedVideo) {
      throw new Error('Upload an MP4, MOV, or WebM swing clip.');
    }

    const upload = await persistUpload(maybeFile);
    const session = await createUploadedSession(upload);

    return NextResponse.json({ session: toUploadedSwingSession(session) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { persistUpload } from '@/lib/storage/uploads';
import type { UploadedSwingSession } from '@/types/session';

const allowedMimeTypes = new Set(['video/mp4', 'video/quicktime', 'video/webm']);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const maybeFile = formData.get('file');

    if (!(maybeFile instanceof File)) {
      throw new Error('A video file is required.');
    }

    if (!allowedMimeTypes.has(maybeFile.type)) {
      throw new Error('Upload an MP4, MOV, or WebM swing clip.');
    }

    const upload = await persistUpload(maybeFile);

    const session: UploadedSwingSession = {
      id: upload.sessionId,
      createdAt: upload.createdAt,
      fileName: upload.originalName,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
      status: 'uploaded'
    };

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

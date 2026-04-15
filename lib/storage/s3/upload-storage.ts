import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, getS3Config, buildPublicObjectUrl, streamBodyToBuffer } from '@/lib/storage/s3/shared';
import type { StoredUpload, UploadStorage } from '@/lib/storage/contracts';

const stagedUploadsRoot = path.join(os.tmpdir(), 'golfswing-uploads');

async function ensureStagedUploadsRoot() {
  await mkdir(stagedUploadsRoot, { recursive: true });
}

export const s3UploadStorage: UploadStorage = {
  async ensure() {
    await ensureStagedUploadsRoot();
  },

  async persist(file) {
    await ensureStagedUploadsRoot();

    const sessionId = randomUUID();
    const extension = path.extname(file.name) || '.mp4';
    const storedName = `${sessionId}${extension.toLowerCase()}`;
    const absolutePath = path.join(stagedUploadsRoot, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    const createdAt = new Date().toISOString();
    const storageKey = `uploads/${sessionId}/${storedName}`;
    const client = getS3Client();
    const { bucket } = getS3Config();

    await writeFile(absolutePath, buffer);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream'
      })
    );

    return {
      sessionId,
      absolutePath,
      storedName,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: buffer.byteLength,
      createdAt,
      storageKey,
      publicUrl: buildPublicObjectUrl(storageKey)
    };
  },

  async prepareForProcessing(upload) {
    try {
      await access(upload.absolutePath);
      return upload.absolutePath;
    } catch {
      if (!upload.storageKey) {
        throw new Error('Stored upload is missing both a local path and an object-storage key.');
      }

      await ensureStagedUploadsRoot();

      const client = getS3Client();
      const { bucket } = getS3Config();
      const response = await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: upload.storageKey
        })
      );
      const buffer = await streamBodyToBuffer(response.Body);
      const fallbackPath = path.join(stagedUploadsRoot, upload.storedName);
      await writeFile(fallbackPath, buffer);
      return fallbackPath;
    }
  },

  async delete(upload) {
    await Promise.allSettled([
      rm(upload.absolutePath, { force: true }),
      upload.storageKey
        ? getS3Client().send(
            new DeleteObjectCommand({
              Bucket: getS3Config().bucket,
              Key: upload.storageKey
            })
          )
        : Promise.resolve()
    ]);
  }
};

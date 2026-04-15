import { readFile } from 'node:fs/promises';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, getS3Config, streamBodyToBuffer } from '@/lib/storage/s3/shared';
import type { ArtifactStorage, GeneratedArtifactInput } from '@/lib/storage/contracts';
import type { MediaArtifact, MediaArtifactResult } from '@/types/media-artifacts';

function buildStorageKey(sessionId: string, fileName: string) {
  return `artifacts/${sessionId}/${fileName}`;
}

function buildArtifactUrl(sessionId: string, fileName: string) {
  return `/api/sessions/${sessionId}/artifacts/${fileName}`;
}

function mapArtifact(sessionId: string, artifact: GeneratedArtifactInput): MediaArtifact {
  return {
    type: artifact.type,
    label: artifact.label,
    fileName: artifact.fileName,
    storageKey: buildStorageKey(sessionId, artifact.fileName),
    absolutePath: null,
    contentType: artifact.contentType,
    urlPath: buildArtifactUrl(sessionId, artifact.fileName)
  };
}

export const s3ArtifactStorage: ArtifactStorage = {
  async ensure() {},

  async persistSessionArtifacts({ sessionId, artifacts }) {
    const client = getS3Client();
    const { bucket } = getS3Config();
    const storedArtifacts: MediaArtifact[] = [];

    for (const artifact of artifacts) {
      const storageKey = buildStorageKey(sessionId, artifact.fileName);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: storageKey,
          Body: await readFile(artifact.sourcePath),
          ContentType: artifact.contentType
        })
      );
      storedArtifacts.push(mapArtifact(sessionId, artifact));
    }

    return storedArtifacts;
  },

  async readArtifact(artifact) {
    const client = getS3Client();
    const { bucket } = getS3Config();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: artifact.storageKey
      })
    );

    return streamBodyToBuffer(response.Body);
  },

  async deleteSessionArtifacts(_sessionId, artifacts) {
    if (!artifacts) {
      return;
    }

    const client = getS3Client();
    const { bucket } = getS3Config();
    const allArtifacts = [artifacts.poster, ...artifacts.keyFrames].filter(
      (artifact): artifact is MediaArtifact => Boolean(artifact)
    );

    await Promise.allSettled(
      allArtifacts.map((artifact) =>
        client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: artifact.storageKey
          })
        )
      )
    );
  }
};

import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import type { ArtifactStorage, GeneratedArtifactInput } from '@/lib/storage/contracts';
import type { MediaArtifact, MediaArtifactResult } from '@/types/media-artifacts';

const artifactsRoot = path.join(process.cwd(), 'data', 'artifacts');

function normalizeStorageKey(storageKey: string) {
  return storageKey.startsWith('artifacts/') ? storageKey.slice('artifacts/'.length) : storageKey;
}

function buildArtifactUrl(sessionId: string, fileName: string) {
  return `/api/sessions/${sessionId}/artifacts/${fileName}`;
}

function buildStorageKey(sessionId: string, fileName: string) {
  return `${sessionId}/${fileName}`;
}

function buildArtifact(sessionId: string, artifact: GeneratedArtifactInput): MediaArtifact {
  const absolutePath = path.join(artifactsRoot, sessionId, artifact.fileName);

  return {
    type: artifact.type,
    label: artifact.label,
    fileName: artifact.fileName,
    storageKey: buildStorageKey(sessionId, artifact.fileName),
    absolutePath,
    contentType: artifact.contentType,
    urlPath: buildArtifactUrl(sessionId, artifact.fileName)
  };
}

export async function ensureLocalArtifactStorage() {
  await mkdir(artifactsRoot, { recursive: true });
}

export const localArtifactStorage: ArtifactStorage = {
  async ensure() {
    await ensureLocalArtifactStorage();
  },

  async persistSessionArtifacts({ sessionId, artifacts }) {
    await ensureLocalArtifactStorage();

    const sessionArtifactRoot = path.join(artifactsRoot, sessionId);
    await mkdir(sessionArtifactRoot, { recursive: true });

    const storedArtifacts: MediaArtifact[] = [];

    for (const artifact of artifacts) {
      const destinationPath = path.join(sessionArtifactRoot, artifact.fileName);
      await copyFile(artifact.sourcePath, destinationPath);
      storedArtifacts.push(buildArtifact(sessionId, artifact));
    }

    return storedArtifacts;
  },

  async readArtifact(artifact) {
    const absolutePath =
      artifact.absolutePath ||
      path.join(artifactsRoot, normalizeStorageKey(artifact.storageKey));

    return readFile(path.normalize(absolutePath));
  },

  async deleteSessionArtifacts(sessionId, artifacts) {
    await Promise.allSettled([
      rm(path.join(artifactsRoot, sessionId), { recursive: true, force: true }),
      ...(artifacts?.keyFrames || []).map((artifact) =>
        artifact.absolutePath ? rm(artifact.absolutePath, { force: true }) : Promise.resolve()
      ),
      artifacts?.poster?.absolutePath ? [rm(artifacts.poster.absolutePath, { force: true })] : []
    ].flat());
  }
};

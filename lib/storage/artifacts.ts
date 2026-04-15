import { localArtifactStorage } from '@/lib/storage/local/artifact-storage';
import { s3ArtifactStorage } from '@/lib/storage/s3/artifact-storage';
import type { ArtifactStorage, GeneratedArtifactInput } from '@/lib/storage/contracts';
import type { MediaArtifact, MediaArtifactResult } from '@/types/media-artifacts';

function resolveArtifactStorage(): ArtifactStorage {
  const provider = process.env.ARTIFACT_STORAGE_PROVIDER || 'local';

  switch (provider) {
    case 'local':
      return localArtifactStorage;
    case 's3':
      return s3ArtifactStorage;
    default:
      throw new Error(`Unsupported artifact storage provider: ${provider}`);
  }
}

export async function persistSessionArtifacts(input: {
  sessionId: string;
  artifacts: GeneratedArtifactInput[];
}): Promise<MediaArtifact[]> {
  return resolveArtifactStorage().persistSessionArtifacts(input);
}

export async function readStoredArtifact(artifact: MediaArtifact): Promise<Buffer> {
  return resolveArtifactStorage().readArtifact(artifact);
}

export async function deleteStoredArtifacts(
  sessionId: string,
  artifacts?: MediaArtifactResult | null
) {
  return resolveArtifactStorage().deleteSessionArtifacts(sessionId, artifacts);
}

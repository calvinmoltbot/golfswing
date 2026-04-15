import type { StoredUpload, UploadStorage } from '@/lib/storage/contracts';
import { ensureLocalStorage, localUploadStorage } from '@/lib/storage/local/upload-storage';
import { s3UploadStorage } from '@/lib/storage/s3/upload-storage';
import type { SwingSessionRecord } from '@/types/session';

function resolveUploadStorage(): UploadStorage {
  const provider = process.env.UPLOAD_STORAGE_PROVIDER || 'local';

  switch (provider) {
    case 'local':
      return localUploadStorage;
    case 's3':
      return s3UploadStorage;
    default:
      throw new Error(`Unsupported upload storage provider: ${provider}`);
  }
}

export { ensureLocalStorage };
export type { StoredUpload };

export async function persistUpload(file: File): Promise<StoredUpload> {
  return resolveUploadStorage().persist(file);
}

export async function prepareUploadForProcessing(
  upload: SwingSessionRecord['file'] | StoredUpload
): Promise<string> {
  return resolveUploadStorage().prepareForProcessing(upload);
}

export async function deleteStoredUpload(upload: SwingSessionRecord['file'] | StoredUpload) {
  return resolveUploadStorage().delete(upload);
}

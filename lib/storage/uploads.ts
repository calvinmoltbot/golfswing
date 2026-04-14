import type { StoredUpload, UploadStorage } from '@/lib/storage/contracts';
import { ensureLocalStorage, localUploadStorage } from '@/lib/storage/local/upload-storage';

function resolveUploadStorage(): UploadStorage {
  const provider = process.env.UPLOAD_STORAGE_PROVIDER || 'local';

  switch (provider) {
    case 'local':
      return localUploadStorage;
    default:
      throw new Error(`Unsupported upload storage provider: ${provider}`);
  }
}

export { ensureLocalStorage };
export type { StoredUpload };

export async function persistUpload(file: File): Promise<StoredUpload> {
  return resolveUploadStorage().persist(file);
}

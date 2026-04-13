export type UploadedSwingSession = {
  id: string;
  createdAt: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'uploaded' | 'analyzing' | 'complete' | 'failed';
};

import type { SwingAnalysisResponse, SwingAnalysisRequest } from '@/types/analysis';

export type SwingSessionStatus = 'uploaded' | 'analyzing' | 'complete' | 'failed';

export type UploadedSwingSession = {
  id: string;
  createdAt: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: SwingSessionStatus;
};

export type SwingSessionRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: SwingSessionStatus;
  notes: string;
  playerContext: SwingAnalysisRequest['playerContext'] | null;
  analysis: SwingAnalysisResponse | null;
  error: string | null;
  file: {
    absolutePath: string;
    storedName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
};

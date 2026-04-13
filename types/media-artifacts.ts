export type MediaArtifact = {
  type: 'poster' | 'key-frame';
  label?: 'address' | 'top' | 'impact' | 'finish';
  fileName: string;
  absolutePath: string;
  contentType: string;
  urlPath: string;
};

export type MediaArtifactProviderInfo = {
  id: string;
  version: string;
};

export type MediaArtifactResult = {
  provider: MediaArtifactProviderInfo;
  poster: MediaArtifact | null;
  keyFrames: MediaArtifact[];
};

export type MediaArtifactProvider = {
  id: string;
  extract(input: {
    sessionId: string;
    videoPath: string;
    keyFrames: Array<{ label: 'address' | 'top' | 'impact' | 'finish'; timestampMs: number }>;
  }): Promise<MediaArtifactResult>;
};

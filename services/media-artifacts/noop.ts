import type { MediaArtifactProvider } from '@/types/media-artifacts';

export function createNoopMediaArtifactProvider(): MediaArtifactProvider {
  return {
    id: 'noop',
    async extract() {
      return {
        provider: {
          id: 'noop',
          version: '1.0.0'
        },
        poster: null,
        keyFrames: []
      };
    }
  };
}

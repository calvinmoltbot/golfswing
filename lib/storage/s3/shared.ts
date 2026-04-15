import { S3Client } from '@aws-sdk/client-s3';

type S3Config = {
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle: boolean;
  publicBaseUrl: string | null;
};

let cachedClient: S3Client | null = null;
let cachedConfig: S3Config | null = null;

export function getS3Config(): S3Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;

  if (!bucket || !region) {
    throw new Error('S3 upload storage requires S3_BUCKET and S3_REGION.');
  }

  cachedConfig = {
    bucket,
    region,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || null
  };

  return cachedConfig;
}

export function getS3Client(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getS3Config();

  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
          }
        : undefined
  });

  return cachedClient;
}

export function buildPublicObjectUrl(key: string): string | null {
  const { publicBaseUrl } = getS3Config();

  if (!publicBaseUrl) {
    return null;
  }

  return `${publicBaseUrl.replace(/\/$/, '')}/${key}`;
}

export async function streamBodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body || typeof body !== 'object') {
    throw new Error('S3 response body was empty.');
  }

  if ('transformToByteArray' in body && typeof body.transformToByteArray === 'function') {
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }

  if (Symbol.asyncIterator in body) {
    const chunks: Buffer[] = [];

    for await (const chunk of body as AsyncIterable<Uint8Array | Buffer | string>) {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      } else {
        chunks.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      }
    }

    return Buffer.concat(chunks);
  }

  throw new Error('Unsupported S3 response body type.');
}

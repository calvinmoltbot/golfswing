import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(cwd, fileName);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requireVars(errors, vars, reason) {
  const missing = vars.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    errors.push(`${reason}: missing ${missing.join(', ')}`);
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const coachingProvider = process.env.COACHING_ANALYSIS_PROVIDER || 'mock';
const sessionProvider = process.env.SESSION_REPOSITORY_PROVIDER || 'local';
const uploadProvider = process.env.UPLOAD_STORAGE_PROVIDER || 'local';
const artifactProvider = process.env.ARTIFACT_STORAGE_PROVIDER || 'local';

const errors = [];
const warnings = [];

if (coachingProvider === 'openrouter') {
  requireVars(errors, ['OPENROUTER_API_KEY'], 'OpenRouter coaching provider');
} else if (coachingProvider !== 'mock') {
  errors.push(`Unsupported COACHING_ANALYSIS_PROVIDER: ${coachingProvider}`);
}

if (sessionProvider === 'neon') {
  if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) {
    errors.push('Neon session repository: missing DATABASE_URL or NEON_DATABASE_URL');
  }
} else if (sessionProvider !== 'local') {
  errors.push(`Unsupported SESSION_REPOSITORY_PROVIDER: ${sessionProvider}`);
}

const s3Vars = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];

if (uploadProvider === 's3') {
  requireVars(errors, s3Vars, 'S3 upload storage');
} else if (uploadProvider !== 'local') {
  errors.push(`Unsupported UPLOAD_STORAGE_PROVIDER: ${uploadProvider}`);
}

if (artifactProvider === 's3') {
  requireVars(errors, s3Vars, 'S3 artifact storage');
} else if (artifactProvider !== 'local') {
  errors.push(`Unsupported ARTIFACT_STORAGE_PROVIDER: ${artifactProvider}`);
}

if (uploadProvider === 's3' || artifactProvider === 's3') {
  warnings.push(
    'S3-compatible storage selected. Confirm S3_ENDPOINT and S3_FORCE_PATH_STYLE if you are using R2 or another non-AWS provider.'
  );
}

if (!process.env.FFMPEG_PATH) {
  warnings.push('FFMPEG_PATH is not set. Local media extraction will fall back to /opt/homebrew/bin/ffmpeg.');
}

console.log('Environment check');
console.log(`- coaching provider: ${coachingProvider}`);
console.log(`- session repository: ${sessionProvider}`);
console.log(`- upload storage: ${uploadProvider}`);
console.log(`- artifact storage: ${artifactProvider}`);

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('\nConfiguration errors:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('\nConfiguration looks usable.');

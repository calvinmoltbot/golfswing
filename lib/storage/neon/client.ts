import { neon } from '@neondatabase/serverless';

type NeonSql = ReturnType<typeof neon>;

let cachedSql: NeonSql | null = null;

export function getNeonSql(): NeonSql {
  if (cachedSql) {
    return cachedSql;
  }

  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'Neon session repository requires DATABASE_URL or NEON_DATABASE_URL to be set.'
    );
  }

  cachedSql = neon(connectionString);
  return cachedSql;
}

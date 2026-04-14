import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured. Please add it to your .env.local file.');
}

export const sql = neon(process.env.DATABASE_URL);

/**
 * Execute a raw parameterized SQL query.
 * Use this for dynamic queries where column names are built at runtime.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await sql(text, params);
  return result as T[];
}

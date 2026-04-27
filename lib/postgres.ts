import { Pool } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not configured. Please add it to your .env.local file.');
}

// Pool supports standard parameterized queries: pool.query(text, params[])
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Execute a raw parameterized SQL query.
 * Usage: query<UserRow>('SELECT * FROM users WHERE id = $1', [id])
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Tagged template literal for safe parameterized SQL.
 * Usage: sql`SELECT * FROM users WHERE id = ${userId}`
 */
export async function sql<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  let text = '';
  const params: unknown[] = [];

  strings.forEach((str, i) => {
    text += str;
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  });

  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Keep a named export for convenience
export { pool };

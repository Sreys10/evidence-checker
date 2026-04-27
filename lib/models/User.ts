import { sql, query } from '../postgres';
import bcrypt from 'bcryptjs';

export interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  userType: 'admin' | 'analyst' | 'verifier' | 'guest';
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

// Map a Postgres row (snake_case) to our User interface (camelCase / _id)
function mapRow(row: Record<string, unknown>): User {
  return {
    _id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    password: row.password as string,
    userType: row.user_type as User['userType'],
    profileImage: row.profile_image as string | undefined,
    createdAt: row.created_at as Date | undefined,
    updatedAt: row.updated_at as Date | undefined,
    lastLogin: row.last_login as Date | undefined,
  };
}

export async function createUser(
  userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>
): Promise<User> {
  const existing = await findUserByEmail(userData.email);
  if (existing) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const result = await sql`
    INSERT INTO users (name, email, password, user_type, profile_image)
    VALUES (
      ${userData.name},
      ${userData.email},
      ${hashedPassword},
      ${userData.userType},
      ${userData.profileImage ?? null}
    )
    RETURNING *
  `;

  return mapRow(result[0] as Record<string, unknown>);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;
  return result.length > 0 ? mapRow(result[0] as Record<string, unknown>) : null;
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function updateLastLogin(email: string): Promise<void> {
  await sql`
    UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE email = ${email}
  `;
}

export async function updateUser(
  email: string,
  updates: Partial<Omit<User, '_id' | 'email' | 'password'>>
): Promise<void> {
  const fieldToColumn: Record<string, string> = {
    name: 'name',
    profileImage: 'profile_image',
    userType: 'user_type',
    lastLogin: 'last_login',
  };

  const setClauses = ['updated_at = NOW()'];
  const params: unknown[] = [];
  let paramIndex = 1;

  for (const [tsKey, sqlCol] of Object.entries(fieldToColumn)) {
    if (tsKey in updates) {
      setClauses.push(`${sqlCol} = $${paramIndex++}`);
      params.push((updates as Record<string, unknown>)[tsKey] ?? null);
    }
  }

  params.push(email);
  await query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE email = $${paramIndex}`,
    params
  );
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  `;
  return result.length > 0 ? mapRow(result[0] as Record<string, unknown>) : null;
}

export async function getAllUsers(): Promise<Omit<User, 'password'>[]> {
  const result = await sql`
    SELECT id, name, email, user_type, profile_image, created_at, updated_at, last_login
    FROM users ORDER BY created_at DESC
  `;
  return result.map((row) => mapRow(row as Record<string, unknown>));
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM users WHERE id = ${id} RETURNING id
  `;
  return Array.isArray(result) && result.length > 0;
}

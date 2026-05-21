import { NextResponse } from 'next/server';
import { sql } from '@/lib/postgres';

/**
 * GET /api/init-db
 * One-time route to create all PostgreSQL tables.
 * Visit http://localhost:3000/api/init-db once after setting up credentials.
 */
export async function GET() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        email       TEXT UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        user_type   TEXT NOT NULL DEFAULT 'analyst',
        profile_image TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW(),
        last_login  TIMESTAMPTZ
      )
    `;

    // Safety: ensure profile_image column exists (for databases created before this was added)
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT
    `;

    // Safety: ensure messages table has read column
    await sql`
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE
    `.catch(() => {/* messages table may not exist yet - OK */});

    // Create cases table
    await sql`
      CREATE TABLE IF NOT EXISTS cases (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_number  TEXT NOT NULL,
        case_name    TEXT NOT NULL,
        created_date TEXT NOT NULL,
        user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    // Create evidence table
    await sql`
      CREATE TABLE IF NOT EXISTS evidence (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_name        TEXT NOT NULL,
        image_url        TEXT,
        upload_date      TEXT NOT NULL,
        analyzed_date    TEXT,
        status           TEXT NOT NULL DEFAULT 'pending',
        result           TEXT,
        confidence       FLOAT,
        size             TEXT,
        type             TEXT,
        case_id          UUID REFERENCES cases(id) ON DELETE CASCADE,
        case_number      TEXT,
        case_name        TEXT,
        evidence_name    TEXT,
        user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        metadata         JSONB,
        anomalies        TEXT[],
        ai_detection     JSONB,
        blockchain_hash  TEXT,
        ipfs_hash        TEXT,
        report_generated BOOLEAN DEFAULT FALSE,
        face_detection   JSONB
      )
    `;

    // Create messages table (for admin-analyst chat)
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message      TEXT NOT NULL,
        read         BOOLEAN DEFAULT FALSE,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `;


    return NextResponse.json(
      {
        success: true,
        message: 'Database tables created successfully!',
        tables: ['users', 'cases', 'evidence', 'messages'],
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('DB init error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

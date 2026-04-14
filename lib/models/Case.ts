import { sql } from '../postgres';

export interface Case {
  _id?: string;
  caseNumber: string;
  caseName: string;
  createdDate: string;
  userId: string;
}

// Map a Postgres row (snake_case) to our Case interface
function mapRow(row: Record<string, unknown>): Case {
  return {
    _id: row.id as string,
    caseNumber: row.case_number as string,
    caseName: row.case_name as string,
    createdDate: row.created_date as string,
    userId: row.user_id as string,
  };
}

export async function createCase(caseData: Omit<Case, '_id'>): Promise<Case> {
  const result = await sql`
    INSERT INTO cases (case_number, case_name, created_date, user_id)
    VALUES (
      ${caseData.caseNumber},
      ${caseData.caseName},
      ${caseData.createdDate},
      ${caseData.userId}
    )
    RETURNING *
  `;
  return mapRow(result[0] as Record<string, unknown>);
}

export async function getCasesByUser(userId: string): Promise<Case[]> {
  const result = await sql`
    SELECT * FROM cases WHERE user_id = ${userId} ORDER BY created_date DESC
  `;
  return result.map((row) => mapRow(row as Record<string, unknown>));
}

export async function deleteCase(id: string, userId: string): Promise<boolean> {
  // evidence rows are cascade-deleted by the ON DELETE CASCADE FK constraint
  const result = await sql`
    DELETE FROM cases WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `;
  return result.length > 0;
}

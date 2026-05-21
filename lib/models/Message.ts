import { sql } from '../postgres';

export interface Message {
  id?: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  createdAt?: string;
  read?: boolean;
  fromName?: string;
  fromUserType?: string;
}

function mapRow(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    fromUserId: row.from_user_id as string,
    toUserId: row.to_user_id as string,
    message: row.message as string,
    createdAt: row.created_at as string,
    read: row.read as boolean,
    fromName: row.from_name as string | undefined,
    fromUserType: row.from_user_type as string | undefined,
  };
}

export async function sendMessage(
  fromUserId: string,
  toUserId: string,
  message: string
): Promise<Message> {
  const result = await sql`
    INSERT INTO messages (from_user_id, to_user_id, message)
    VALUES (${fromUserId}, ${toUserId}, ${message})
    RETURNING *
  `;
  return mapRow(result[0] as Record<string, unknown>);
}

export async function getConversation(
  userId1: string,
  userId2: string
): Promise<Message[]> {
  const result = await sql`
    SELECT m.*, u.name AS from_name, u.user_type AS from_user_type
    FROM messages m
    JOIN users u ON u.id = m.from_user_id
    WHERE (m.from_user_id = ${userId1} AND m.to_user_id = ${userId2})
       OR (m.from_user_id = ${userId2} AND m.to_user_id = ${userId1})
    ORDER BY m.created_at ASC
  `;
  return result.map((row) => mapRow(row as Record<string, unknown>));
}

export async function markMessagesRead(
  fromUserId: string,
  toUserId: string
): Promise<void> {
  await sql`
    UPDATE messages
    SET read = TRUE
    WHERE from_user_id = ${fromUserId}
      AND to_user_id = ${toUserId}
      AND read = FALSE
  `;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await sql`
    SELECT COUNT(*) AS count
    FROM messages
    WHERE to_user_id = ${userId} AND read = FALSE
  `;
  return parseInt((result[0] as Record<string, unknown>).count as string, 10);
}

export async function getConversationPartners(
  adminId: string
): Promise<{ userId: string; name: string; userType: string; unread: number; lastMessage: string; lastAt: string }[]> {
  const result = await sql`
    SELECT DISTINCT ON (partner_id)
      partner_id,
      partner_name,
      partner_user_type,
      last_message,
      last_at,
      unread
    FROM (
      SELECT
        CASE WHEN m.from_user_id = ${adminId} THEN m.to_user_id ELSE m.from_user_id END AS partner_id,
        CASE WHEN m.from_user_id = ${adminId} THEN tu.name ELSE fu.name END AS partner_name,
        CASE WHEN m.from_user_id = ${adminId} THEN tu.user_type ELSE fu.user_type END AS partner_user_type,
        m.message AS last_message,
        m.created_at AS last_at,
        COUNT(CASE WHEN m.to_user_id = ${adminId} AND m.read = FALSE THEN 1 END)
          OVER (PARTITION BY CASE WHEN m.from_user_id = ${adminId} THEN m.to_user_id ELSE m.from_user_id END)
          AS unread
      FROM messages m
      JOIN users fu ON fu.id = m.from_user_id
      JOIN users tu ON tu.id = m.to_user_id
      WHERE m.from_user_id = ${adminId} OR m.to_user_id = ${adminId}
      ORDER BY m.created_at DESC
    ) sub
    ORDER BY partner_id, last_at DESC
  `;
  return result.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      userId: r.partner_id as string,
      name: r.partner_name as string,
      userType: r.partner_user_type as string,
      unread: parseInt(r.unread as string, 10) || 0,
      lastMessage: r.last_message as string,
      lastAt: r.last_at as string,
    };
  });
}

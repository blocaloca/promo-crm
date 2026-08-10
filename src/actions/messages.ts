"use server";

import { sql } from "@/lib/db";
import { ORG_ID, OWNER_ID } from "@/lib/constants";
import type { Message } from "@/lib/types";

export async function listMessages(): Promise<Message[]> {
  const rows = await sql`SELECT * FROM messages WHERE org_id = ${ORG_ID} ORDER BY msg_type`;
  return rows as Message[];
}

export async function createMessage(draft: Partial<Message>): Promise<void> {
  await sql`
    INSERT INTO messages (org_id, owner_id, label, body, msg_type, sector, channel_hint)
    VALUES (${ORG_ID}, ${OWNER_ID}, ${draft.label}, ${draft.body}, ${draft.msg_type},
      ${draft.sector ?? null}, ${draft.channel_hint ?? null})
  `;
}

export async function updateMessage(id: string, draft: Partial<Message>): Promise<void> {
  await sql`
    UPDATE messages SET label = ${draft.label}, body = ${draft.body}, msg_type = ${draft.msg_type},
      sector = ${draft.sector ?? null}, channel_hint = ${draft.channel_hint ?? null}
    WHERE id = ${id}
  `;
}

export async function deleteMessage(id: string): Promise<void> {
  await sql`DELETE FROM messages WHERE id = ${id}`;
}

"use server";

import { sql } from "@/lib/db";
import { ORG_ID, OWNER_ID } from "@/lib/constants";
import type { ListRow, Prospect } from "@/lib/types";

export async function listListsBasic(): Promise<ListRow[]> {
  const rows = await sql`SELECT id, name FROM lists WHERE org_id = ${ORG_ID} ORDER BY name`;
  return rows as ListRow[];
}

export async function listListsWithCounts(): Promise<(ListRow & { count: number; done: number })[]> {
  const rows = await sql`
    SELECT l.id, l.name,
      COUNT(lm.prospect_id)::int AS count,
      COUNT(lm.prospect_id) FILTER (WHERE lm.done)::int AS done
    FROM lists l
    LEFT JOIN list_members lm ON lm.list_id = l.id
    WHERE l.org_id = ${ORG_ID}
    GROUP BY l.id, l.name, l.created_at
    ORDER BY l.created_at DESC
  `;
  return rows as (ListRow & { count: number; done: number })[];
}

export async function createList(name: string): Promise<void> {
  await sql`INSERT INTO lists (org_id, owner_id, name) VALUES (${ORG_ID}, ${OWNER_ID}, ${name})`;
}

export async function deleteList(id: string): Promise<void> {
  await sql`DELETE FROM lists WHERE id = ${id}`;
}

export async function getListMembers(listId: string): Promise<Prospect[]> {
  const rows = await sql`
    SELECT p.* FROM list_members lm
    JOIN prospects p ON p.id = lm.prospect_id
    WHERE lm.list_id = ${listId}
    ORDER BY lm.position
  `;
  return rows as Prospect[];
}

export async function getListMembershipMap(): Promise<Record<string, string[]>> {
  const rows = await sql`
    SELECT lm.prospect_id, lm.list_id
    FROM list_members lm
    JOIN lists l ON l.id = lm.list_id
    WHERE l.org_id = ${ORG_ID}
  `;
  const map: Record<string, string[]> = {};
  for (const r of rows as { prospect_id: string; list_id: string }[]) {
    (map[r.prospect_id] ??= []).push(r.list_id);
  }
  return map;
}

export async function addToList(prospectId: string, listId: string): Promise<void> {
  const countRows = await sql`SELECT COUNT(*)::int AS count FROM list_members WHERE list_id = ${listId}`;
  const position = (countRows[0] as { count: number }).count;
  await sql`INSERT INTO list_members (list_id, prospect_id, position) VALUES (${listId}, ${prospectId}, ${position})`;
}

export async function removeFromList(prospectId: string, listId: string): Promise<void> {
  await sql`DELETE FROM list_members WHERE list_id = ${listId} AND prospect_id = ${prospectId}`;
}

export interface RunListMember extends Prospect {
  done: boolean;
  position: number | null;
}

export async function getListRunData(listId: string): Promise<{ name: string; members: RunListMember[] }> {
  const listRows = await sql`SELECT name FROM lists WHERE id = ${listId}`;
  const name = (listRows[0] as { name: string } | undefined)?.name ?? "";
  const rows = await sql`
    SELECT p.*, lm.done, lm.position
    FROM list_members lm
    JOIN prospects p ON p.id = lm.prospect_id
    WHERE lm.list_id = ${listId}
    ORDER BY lm.position NULLS LAST
  `;
  return { name, members: rows as RunListMember[] };
}

export async function markListMemberDone(listId: string, prospectId: string): Promise<void> {
  await sql`UPDATE list_members SET done = true WHERE list_id = ${listId} AND prospect_id = ${prospectId}`;
}

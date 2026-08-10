"use server";

import { sql } from "@/lib/db";
import { ORG_ID, OWNER_ID } from "@/lib/constants";
import type { Prospect, ProspectState } from "@/lib/types";

export async function listProspects(sortNewest = false): Promise<Prospect[]> {
  const rows = sortNewest
    ? await sql`SELECT * FROM prospects WHERE org_id = ${ORG_ID} ORDER BY created_at DESC`
    : await sql`SELECT * FROM prospects WHERE org_id = ${ORG_ID} ORDER BY last_touched ASC NULLS FIRST`;
  return rows as Prospect[];
}

export async function listProspectsForDuplicateCheck(): Promise<
  Pick<Prospect, "id" | "name" | "company" | "linkedin_url">[]
> {
  const rows = await sql`SELECT id, name, company, linkedin_url FROM prospects WHERE org_id = ${ORG_ID}`;
  return rows as Pick<Prospect, "id" | "name" | "company" | "linkedin_url">[];
}

export async function createProspect(draft: Partial<Prospect>): Promise<void> {
  await sql`
    INSERT INTO prospects (org_id, owner_id, name, title, company, sector, region, tier,
      linkedin_url, email, instagram, phone, state, south_america_relevant, notes)
    VALUES (${ORG_ID}, ${OWNER_ID}, ${draft.name}, ${draft.title ?? null}, ${draft.company ?? null},
      ${draft.sector ?? null}, ${draft.region ?? null}, ${draft.tier ?? null},
      ${draft.linkedin_url ?? null}, ${draft.email ?? null}, ${draft.instagram ?? null},
      ${draft.phone ?? null}, ${draft.state ?? "prospect"}, ${draft.south_america_relevant ?? false},
      ${draft.notes ?? null})
  `;
}

export async function updateProspectState(id: string, state: ProspectState): Promise<void> {
  await sql`UPDATE prospects SET state = ${state} WHERE id = ${id}`;
}

export async function updateProspect(id: string, patch: Partial<Prospect>): Promise<void> {
  await sql`
    UPDATE prospects SET
      name = ${patch.name}, title = ${patch.title ?? null}, company = ${patch.company ?? null},
      sector = ${patch.sector ?? null}, region = ${patch.region ?? null}, tier = ${patch.tier ?? null},
      linkedin_url = ${patch.linkedin_url ?? null}, email = ${patch.email ?? null},
      instagram = ${patch.instagram ?? null}, phone = ${patch.phone ?? null},
      notes = ${patch.notes ?? null}, south_america_relevant = ${patch.south_america_relevant ?? false}
    WHERE id = ${id}
  `;
}

export async function deleteProspect(id: string): Promise<void> {
  await sql`DELETE FROM prospects WHERE id = ${id}`;
}

export interface ImportRow {
  name: string;
  title: string | null;
  company: string | null;
  sector: string | null;
  region: string | null;
  tier: string | null;
  linkedin_url: string | null;
  email: string | null;
  instagram: string | null;
  south_america_relevant: boolean;
  notes: string | null;
}

export async function bulkInsertProspects(rows: ImportRow[]): Promise<{ error?: string }> {
  if (!rows.length) return {};
  try {
    await sql.transaction(
      rows.map(
        (r) => sql`
          INSERT INTO prospects (org_id, owner_id, name, title, company, sector, region, tier,
            linkedin_url, email, instagram, south_america_relevant, notes, state, last_touched)
          VALUES (${ORG_ID}, ${OWNER_ID}, ${r.name}, ${r.title}, ${r.company}, ${r.sector}, ${r.region},
            ${r.tier}, ${r.linkedin_url}, ${r.email}, ${r.instagram}, ${r.south_america_relevant}, ${r.notes},
            'prospect', NULL)
        `,
      ),
    );
    return {};
  } catch (e: any) {
    return { error: e.message ?? "Insert failed" };
  }
}

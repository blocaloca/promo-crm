"use server";

import { sql } from "@/lib/db";
import { ORG_ID, OWNER_ID } from "@/lib/constants";
import type { Promo } from "@/lib/types";

function randomToken() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
}

export async function listPromos(): Promise<Promo[]> {
  const rows = await sql`SELECT * FROM promos WHERE org_id = ${ORG_ID} ORDER BY created_at DESC`;
  return rows as Promo[];
}

export async function getPromoAssetIds(promoId: string): Promise<string[]> {
  const rows = await sql`SELECT asset_id FROM promo_assets WHERE promo_id = ${promoId} ORDER BY slot`;
  return (rows as { asset_id: string }[]).map((r) => r.asset_id);
}

export interface SavePromoInput {
  id?: string;
  name: string;
  template_key: string;
  aspect_ratio: string | null;
  headline: string | null;
  body_copy: string | null;
  link_url_1: string | null;
  link_url_2: string | null;
  contact_phone: string | null;
  angle: string | null;
  og_title: string | null;
  og_description: string | null;
  brand_title: string | null;
  logo_asset_id: string | null;
  public_token: string | null;
  assetIds: string[];
}

// every save makes the promo live — there's no separate publish step, so a
// promo is always shareable as soon as it has been saved once
export async function savePromo(
  input: SavePromoInput,
): Promise<{ id: string; publicToken: string; error?: string }> {
  const publicToken = input.public_token || randomToken();

  try {
    if (input.id) {
      const promoId = input.id;
      await sql.transaction([
        sql`
          UPDATE promos SET
            name = ${input.name}, template_key = ${input.template_key}, aspect_ratio = ${input.aspect_ratio},
            headline = ${input.headline}, body_copy = ${input.body_copy}, link_url_1 = ${input.link_url_1},
            link_url_2 = ${input.link_url_2}, contact_phone = ${input.contact_phone}, angle = ${input.angle},
            og_title = ${input.og_title}, og_description = ${input.og_description},
            brand_title = ${input.brand_title}, logo_asset_id = ${input.logo_asset_id},
            public_token = ${publicToken}, status = 'published'
          WHERE id = ${promoId}
        `,
        sql`DELETE FROM promo_assets WHERE promo_id = ${promoId}`,
        ...input.assetIds.map(
          (assetId, slot) =>
            sql`INSERT INTO promo_assets (promo_id, asset_id, slot) VALUES (${promoId}, ${assetId}, ${slot})`,
        ),
      ]);
      return { id: promoId, publicToken };
    }

    const rows = await sql`
      INSERT INTO promos (org_id, owner_id, name, template_key, aspect_ratio, headline, body_copy,
        link_url_1, link_url_2, contact_phone, angle, og_title, og_description, brand_title,
        logo_asset_id, public_token, status, view_count)
      VALUES (${ORG_ID}, ${OWNER_ID}, ${input.name}, ${input.template_key}, ${input.aspect_ratio},
        ${input.headline}, ${input.body_copy}, ${input.link_url_1}, ${input.link_url_2},
        ${input.contact_phone}, ${input.angle}, ${input.og_title}, ${input.og_description},
        ${input.brand_title}, ${input.logo_asset_id}, ${publicToken}, 'published', 0)
      RETURNING id
    `;
    const promoId = (rows[0] as { id: string }).id;

    if (input.assetIds.length) {
      await sql.transaction(
        input.assetIds.map(
          (assetId, slot) =>
            sql`INSERT INTO promo_assets (promo_id, asset_id, slot) VALUES (${promoId}, ${assetId}, ${slot})`,
        ),
      );
    }

    return { id: promoId, publicToken };
  } catch (e: any) {
    return { id: input.id ?? "", publicToken, error: e.message ?? "Save failed" };
  }
}

export async function deletePromo(id: string): Promise<void> {
  await sql`DELETE FROM promos WHERE id = ${id}`;
}

export async function getPublishedPromoByToken(
  token: string,
): Promise<{ promo: Promo; urls: string[]; logoUrl: string | null } | null> {
  const rows = await sql`SELECT * FROM promos WHERE public_token = ${token} AND status = 'published'`;
  const promo = (rows as Promo[])[0];
  if (!promo) return null;

  const paRows = await sql`
    SELECT a.storage_path FROM promo_assets pa
    JOIN assets a ON a.id = pa.asset_id
    WHERE pa.promo_id = ${promo.id}
    ORDER BY pa.slot
  `;
  const urls = (paRows as { storage_path: string }[]).map((r) => r.storage_path);

  let logoUrl: string | null = null;
  if (promo.logo_asset_id) {
    const logoRows = await sql`SELECT storage_path FROM assets WHERE id = ${promo.logo_asset_id}`;
    logoUrl = (logoRows[0] as { storage_path: string } | undefined)?.storage_path ?? null;
  }

  return { promo, urls, logoUrl };
}

export async function incrementPromoView(id: string): Promise<void> {
  await sql`UPDATE promos SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ${id}`;
}

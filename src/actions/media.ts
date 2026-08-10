"use server";

import { put, del } from "@vercel/blob";
import { sql } from "@/lib/db";
import { ORG_ID, OWNER_ID } from "@/lib/constants";
import type { Asset } from "@/lib/types";

export async function listAssets(): Promise<Asset[]> {
  const rows = await sql`SELECT * FROM assets WHERE org_id = ${ORG_ID} ORDER BY created_at DESC`;
  return rows as Asset[];
}

async function createAsset(input: {
  storagePath: string;
  thumbPath: string;
  filename: string;
  width: number;
  height: number;
  orientation: string;
  sector: string[];
}): Promise<void> {
  await sql`
    INSERT INTO assets (org_id, owner_id, storage_path, thumb_path, filename, width, height, orientation, sector)
    VALUES (${ORG_ID}, ${OWNER_ID}, ${input.storagePath}, ${input.thumbPath}, ${input.filename},
      ${input.width}, ${input.height}, ${input.orientation}, ${input.sector})
  `;
}

// Images are downscaled client-side (src/lib/downscale.ts, needs canvas/DOM
// APIs), then handed to this action as FormData so the Blob token never
// reaches the browser.
export async function uploadAsset(formData: FormData): Promise<{ error?: string }> {
  const file = formData.get("file");
  const thumb = formData.get("thumb");
  if (!(file instanceof Blob) || !(thumb instanceof Blob)) return { error: "Missing file" };

  const filename = String(formData.get("filename") ?? "");
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));
  const orientation = String(formData.get("orientation") ?? "");
  const sector = String(formData.get("sector") ?? "");

  const key = `${ORG_ID}/${crypto.randomUUID()}`;

  try {
    const [main, thumbBlob] = await Promise.all([
      put(`${key}.jpg`, file, { access: "public", addRandomSuffix: false, contentType: "image/jpeg" }),
      put(`${key}_t.jpg`, thumb, { access: "public", addRandomSuffix: false, contentType: "image/jpeg" }),
    ]);
    await createAsset({
      storagePath: main.url,
      thumbPath: thumbBlob.url,
      filename,
      width,
      height,
      orientation,
      sector: sector ? sector.split(",").map((s) => s.trim()) : [],
    });
    return {};
  } catch (e: any) {
    return { error: e.message ?? "Upload failed" };
  }
}

export async function deleteAsset(id: string): Promise<{ error?: string }> {
  const rows = await sql`SELECT storage_path, thumb_path FROM assets WHERE id = ${id}`;
  const asset = (rows as { storage_path: string; thumb_path: string }[])[0];
  if (!asset) return {};

  try {
    await sql`DELETE FROM assets WHERE id = ${id}`;
  } catch (e: any) {
    if (e.code === "23503" || e.code === "23001") return { error: "used-in-promo" };
    return { error: e.message ?? "Delete failed" };
  }

  await Promise.all([del(asset.storage_path), del(asset.thumb_path)]);
  return {};
}

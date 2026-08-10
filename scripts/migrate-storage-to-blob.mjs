// One-off migration: copy images from Supabase Storage (bucket "promo-assets")
// to Vercel Blob, updating assets.storage_path/thumb_path in Neon to the new
// Blob URLs. Idempotent — rows whose storage_path is already an https:// URL
// are skipped, so it's safe to re-run after a partial failure.
//
// Usage: node --env-file=.env.migration.local scripts/migrate-storage-to-blob.mjs

import { createClient } from "@supabase/supabase-js";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const sql = neon(process.env.DATABASE_URL);
const BUCKET = "promo-assets";

async function uploadPath(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw new Error(`download ${path}: ${error.message}`);
  const bytes = new Uint8Array(await data.arrayBuffer());
  const blob = await put(path, bytes, {
    access: "public",
    addRandomSuffix: false,
    contentType: data.type || "image/jpeg",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}

function isBlobUrl(value) {
  return typeof value === "string" && value.startsWith("https://");
}

async function main() {
  const rows = await sql`
    SELECT id, storage_path, thumb_path FROM assets ORDER BY created_at
  `;

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    if (isBlobUrl(row.storage_path) && isBlobUrl(row.thumb_path)) {
      skipped++;
      console.log(`skip  ${row.id} (already migrated)`);
      continue;
    }

    try {
      const [storageUrl, thumbUrl] = await Promise.all([
        isBlobUrl(row.storage_path) ? row.storage_path : uploadPath(row.storage_path),
        isBlobUrl(row.thumb_path) ? row.thumb_path : uploadPath(row.thumb_path),
      ]);

      await sql`
        UPDATE assets SET storage_path = ${storageUrl}, thumb_path = ${thumbUrl}
        WHERE id = ${row.id}
      `;

      migrated++;
      console.log(`ok    ${row.id}`);
    } catch (err) {
      failed++;
      console.error(`FAIL  ${row.id}: ${err.message}`);
    }
  }

  console.log(
    `\nDone. migrated=${migrated} skipped=${skipped} failed=${failed} total=${rows.length}`,
  );
  if (failed > 0) {
    console.log("Re-run this script to retry failed assets.");
    process.exitCode = 1;
  }
}

main();

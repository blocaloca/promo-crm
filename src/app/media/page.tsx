"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { getOrgId } from "@/lib/org";
import type { Asset } from "@/lib/types";
import { downscale, orientationOf } from "@/lib/downscale";

const BUCKET = "promo-assets";

export default function Media() {
  const supabase = createClient();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [sector, setSector] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const org = await getOrgId(); if (!org) return;
    const { data } = await supabase.from("assets").select("*").eq("org_id", org).order("created_at", { ascending: false });
    setAssets(data ?? []);
    // signed thumb urls (private bucket)
    const map: Record<string, string> = {};
    for (const a of data ?? []) {
      const { data: s } = await supabase.storage.from(BUCKET).createSignedUrl(a.thumb_path, 3600);
      if (s) map[a.id] = s.signedUrl;
    }
    setUrls(map);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const org = await getOrgId(); if (!org) return;
    const { data: { user } } = await supabase.auth.getUser();
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const { blob, width, height, thumb } = await downscale(file);
        const base = `${org}/${crypto.randomUUID()}`;
        const path = `${base}.jpg`, thumbPath = `${base}_t.jpg`;
        await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
        await supabase.storage.from(BUCKET).upload(thumbPath, thumb, { contentType: "image/jpeg" });
        await supabase.from("assets").insert({
          org_id: org, owner_id: user!.id, storage_path: path, thumb_path: thumbPath,
          filename: file.name, width, height, orientation: orientationOf(width, height),
          sector: sector ? sector.split(",").map((s) => s.trim()) : [],
        });
      } catch (e) { console.error("upload failed", e); }
    }
    setUploading(false); if (fileRef.current) fileRef.current.value = ""; load();
  }

  async function del(a: Asset) {
    if (!window.confirm(`Delete "${a.filename ?? "this image"}"? This can't be undone.`)) return;
    setDeleteError("");
    // delete the DB row first — if it's in use as a promo's main image, the FK
    // restrict blocks this and the storage files are left untouched
    const { error } = await supabase.from("assets").delete().eq("id", a.id);
    if (error) {
      setDeleteError(error.message.includes("foreign key") ? `"${a.filename ?? "This image"}" is used in a promo — remove it there first.` : error.message);
      return;
    }
    await supabase.storage.from(BUCKET).remove([a.storage_path, a.thumb_path]);
    load();
  }

  return (
    <div>
      <div className="panel p-4 my-3 flex items-center gap-2 flex-wrap">
        <input className="input w-48" placeholder="tag sector(s), comma" value={sector} onChange={(e) => setSector(e.target.value)} />
        <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" className="hidden"
          onChange={(e) => onFiles(e.target.files)} />
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload from phone / library"}
        </button>
        <span className="text-xs text-muted">downscaled on device before upload</span>
      </div>
      {deleteError && <p className="text-cold text-sm mb-2">{deleteError}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {assets.map((a) => (
          <div key={a.id} className="panel overflow-hidden relative group">
            {urls[a.id]
              ? <img src={urls[a.id]} alt={a.filename ?? ""} className="w-full h-32 object-cover" />
              : <div className="w-full h-32 bg-edge animate-pulse" />}
            <button onClick={() => del(a)} className="absolute top-1 right-1 chip bg-panel text-xs hover:text-cold">Delete</button>
            <div className="p-2 text-xs text-muted truncate">{(a.sector ?? []).join(", ") || a.filename}</div>
          </div>
        ))}
        {assets.length === 0 && <div className="text-muted text-sm p-4">Media library is empty.</div>}
      </div>
    </div>
  );
}

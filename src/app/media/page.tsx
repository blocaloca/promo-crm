"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { listAssets, uploadAsset, deleteAsset } from "@/actions/media";
import type { Asset } from "@/lib/types";
import { downscale, orientationOf } from "@/lib/downscale";

export default function Media() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sector, setSector] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setAssets(await listAssets());
  }, []);
  useEffect(() => { load(); }, [load]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError("");
    for (const file of Array.from(files)) {
      try {
        const { blob, width, height, thumb } = await downscale(file);
        const formData = new FormData();
        formData.set("file", blob, "main.jpg");
        formData.set("thumb", thumb, "thumb.jpg");
        formData.set("filename", file.name);
        formData.set("width", String(width));
        formData.set("height", String(height));
        formData.set("orientation", orientationOf(width, height));
        formData.set("sector", sector);
        const { error } = await uploadAsset(formData);
        if (error) setUploadError(error);
      } catch (e) { console.error("upload failed", e); }
    }
    setUploading(false); if (fileRef.current) fileRef.current.value = ""; load();
  }

  async function del(a: Asset) {
    if (!window.confirm(`Delete "${a.filename ?? "this image"}"? This can't be undone.`)) return;
    setDeleteError("");
    const { error } = await deleteAsset(a.id);
    if (error) {
      setDeleteError(error === "used-in-promo" ? `"${a.filename ?? "This image"}" is used in a promo — remove it there first.` : error);
      return;
    }
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
      {uploadError && <p className="text-cold text-sm mb-2">{uploadError}</p>}
      {deleteError && <p className="text-cold text-sm mb-2">{deleteError}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {assets.map((a) => (
          <div key={a.id} className="panel overflow-hidden relative group">
            <img src={a.thumb_path} alt={a.filename ?? ""} className="w-full h-32 object-cover" />
            <button onClick={() => del(a)} className="absolute top-1 right-1 chip bg-panel text-xs hover:text-cold">Delete</button>
            <div className="p-2 text-xs text-muted truncate">{(a.sector ?? []).join(", ") || a.filename}</div>
          </div>
        ))}
        {assets.length === 0 && <div className="text-muted text-sm p-4">Media library is empty.</div>}
      </div>
    </div>
  );
}

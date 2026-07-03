"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { getOrgId } from "@/lib/org";
import { PromoRenderer, AspectFrame, PROMO_TEMPLATES, getTemplate, DEFAULT_TEMPLATE_KEY } from "@/components/promo-templates";
import type { Promo, Asset } from "@/lib/types";

const BUCKET = "promo-assets";
const ASPECTS = ["1.91:1", "1:1", "4:5", "9:16", "letter"];
const token = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);

export default function Promos() {
  const supabase = createClient();
  const [rows, setRows] = useState<Promo[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Promo | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [draft, setDraft] = useState<Partial<Promo>>({ template_key: DEFAULT_TEMPLATE_KEY, aspect_ratio: "1.91:1", status: "draft" });

  const load = useCallback(async () => {
    const org = await getOrgId(); if (!org) return;
    const { data: p } = await supabase.from("promos").select("*").eq("org_id", org).order("created_at", { ascending: false });
    const { data: a } = await supabase.from("assets").select("*").eq("org_id", org).order("created_at", { ascending: false });
    setRows(p ?? []); setAssets(a ?? []);
    const map: Record<string, string> = {};
    for (const as of a ?? []) {
      const { data: s } = await supabase.storage.from(BUCKET).createSignedUrl(as.thumb_path, 3600);
      if (s) map[as.id] = s.signedUrl;
    }
    setThumbs(map);
  }, []);
  useEffect(() => { load(); }, [load]);

  function startNew() { setEditing({} as Promo); setDraft({ template_key: DEFAULT_TEMPLATE_KEY, aspect_ratio: "1.91:1", status: "draft" }); setPicked([]); }
  async function edit(p: Promo) {
    setEditing(p); setDraft(p);
    const { data } = await supabase.from("promo_assets").select("asset_id, slot").eq("promo_id", p.id).order("slot");
    setPicked((data ?? []).map((r) => r.asset_id));
  }

  async function save(publish = false) {
    const org = await getOrgId(); if (!org || !draft.name) return;
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = { ...draft, org_id: org, owner_id: user!.id, status: publish ? "published" : draft.status };
    if (publish && !payload.public_token) payload.public_token = token();
    let promoId = (editing as Promo)?.id;
    if (promoId) { await supabase.from("promos").update(payload).eq("id", promoId); }
    else { const { data } = await supabase.from("promos").insert(payload).select("id").single(); promoId = data!.id; }
    // rewrite slots
    await supabase.from("promo_assets").delete().eq("promo_id", promoId);
    if (picked.length) await supabase.from("promo_assets").insert(picked.map((asset_id, slot) => ({ promo_id: promoId, asset_id, slot })));
    setEditing(null); load();
  }

  const template = getTemplate(draft.template_key);

  function setTemplateKey(key: string) {
    const next = getTemplate(key);
    setDraft({ ...draft, template_key: key });
    setPicked((p) => p.slice(0, next.maxImages));
  }

  function togglePick(id: string) {
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id);
      if (p.length >= template.maxImages) return p;
      return [...p, id];
    });
  }

  if (editing) {
    const previewUrls = picked.map((id) => thumbs[id]).filter(Boolean) as string[];
    const atMax = picked.length >= template.maxImages;
    return (
      <div className="my-3 grid gap-4 lg:grid-cols-2 items-start">
        <div className="panel p-4 grid gap-2">
          <div className="mono text-xs text-muted">template</div>
          <div className="flex gap-2 flex-wrap">
            {PROMO_TEMPLATES.map((t) => (
              <button key={t.key} onClick={() => setTemplateKey(t.key)}
                className={`btn ${draft.template_key === t.key ? "btn-primary" : "btn-ghost"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            <input className="input flex-1" placeholder="promo name*" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <select className="input w-auto" value={draft.aspect_ratio} onChange={(e) => setDraft({ ...draft, aspect_ratio: e.target.value })}>
              {ASPECTS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <input className="input w-40" placeholder="angle" value={draft.angle ?? ""} onChange={(e) => setDraft({ ...draft, angle: e.target.value })} />
          </div>
          <input className="input" placeholder="headline" value={draft.headline ?? ""} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} />
          <textarea className="input" placeholder="body copy" value={draft.body_copy ?? ""} onChange={(e) => setDraft({ ...draft, body_copy: e.target.value })} />
          <input className="input" placeholder="CTA link url" value={draft.link_url ?? ""} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} />
          <div className="mono text-xs text-muted mt-2">link preview (what LinkedIn shows)</div>
          <input className="input" placeholder="og title" value={draft.og_title ?? ""} onChange={(e) => setDraft({ ...draft, og_title: e.target.value })} />
          <input className="input" placeholder="og description" value={draft.og_description ?? ""} onChange={(e) => setDraft({ ...draft, og_description: e.target.value })} />

          <div className="mono text-xs text-muted mt-2">
            images ({picked.length}/{template.maxImages} selected — {template.label} wants {template.minImages === template.maxImages ? template.maxImages : `${template.minImages}–${template.maxImages}`}, first = preview image)
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {assets.map((a) => {
              const isPicked = picked.includes(a.id);
              const disabled = !isPicked && atMax;
              return (
                <button key={a.id} onClick={() => togglePick(a.id)} disabled={disabled}
                  className={`panel overflow-hidden relative ${isPicked ? "ring-2 ring-white" : ""} ${disabled ? "opacity-40" : ""}`}>
                  {thumbs[a.id] && <img src={thumbs[a.id]} className="w-full h-20 object-cover" />}
                  {isPicked && <span className="absolute top-1 left-1 chip bg-panel">{picked.indexOf(a.id) + 1}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-ghost" onClick={() => save(false)}>Save draft</button>
            <button className="btn btn-primary" onClick={() => save(true)}>Save & publish</button>
            <button className="btn btn-ghost ml-auto" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>

        <div className="grid gap-2 lg:sticky lg:top-4">
          <div className="mono text-xs text-muted">preview — {draft.aspect_ratio}</div>
          <AspectFrame aspectRatio={draft.aspect_ratio}>
            <PromoRenderer promo={draft} imageUrls={previewUrls} />
          </AspectFrame>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="my-3"><button className="btn btn-primary" onClick={startNew}>+ Promo</button></div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((p) => (
          <div key={p.id} className="panel p-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{p.name}</span>
              <span className={`chip ${p.status === "published" ? "text-ok border-ok" : "text-muted"}`}>{p.status}</span>
              {p.angle && <span className="chip text-muted">{p.angle}</span>}
            </div>
            {p.headline && <div className="text-sm text-muted mt-1">{p.headline}</div>}
            <div className="flex gap-2 mt-2 flex-wrap items-center">
              <button className="btn btn-ghost text-sm" onClick={() => edit(p)}>Edit</button>
              {p.public_token && (
                <>
                  <a className="btn btn-ghost text-sm" href={`/p/${p.public_token}`} target="_blank">View ↗</a>
                  <span className="mono text-xs text-muted">{p.view_count} views</span>
                </>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-muted text-sm p-4">No promos yet.</div>}
      </div>
    </div>
  );
}

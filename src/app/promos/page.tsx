"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { getOrgId } from "@/lib/org";
import {
  PromoRenderer, AspectFrame, getTemplate, DEFAULT_TEMPLATE_KEY,
  ASPECT_PRESETS, FONT_OPTIONS, FONT_SIZE_OPTIONS, PADDING_OPTIONS, LINE_HEIGHT_OPTIONS,
  TEXT_PLACEMENT_OPTIONS, IMAGE_ANCHOR_OPTIONS,
} from "@/components/promo-templates";
import type { Promo, Asset } from "@/lib/types";

const BUCKET = "promo-assets";
const token = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
const DEFAULT_STYLE = {
  font_family: "hanken", font_size: "md", padding: "md", line_height: "normal",
  text_placement: "bottom", image_anchor: "center center", brand_mode: "title",
};

export default function Promos() {
  const supabase = createClient();
  const [rows, setRows] = useState<Promo[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Promo | null>(null);
  const [saveError, setSaveError] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [draft, setDraft] = useState<Partial<Promo>>({ template_key: DEFAULT_TEMPLATE_KEY, aspect_ratio: "1.91:1", status: "draft", ...DEFAULT_STYLE });

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

  function startNew() { setEditing({} as Promo); setDraft({ template_key: DEFAULT_TEMPLATE_KEY, aspect_ratio: "1.91:1", status: "draft", ...DEFAULT_STYLE }); setPicked([]); }
  async function edit(p: Promo) {
    setEditing(p); setDraft(p);
    const { data } = await supabase.from("promo_assets").select("asset_id, slot").eq("promo_id", p.id).order("slot");
    setPicked((data ?? []).map((r) => r.asset_id));
  }

  async function save(publish = false) {
    const org = await getOrgId(); if (!org || !draft.name) return;
    setSaveError("");
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = { ...draft, org_id: org, owner_id: user!.id, status: publish ? "published" : draft.status };
    if (publish && !payload.public_token) payload.public_token = token();
    let promoId = (editing as Promo)?.id;
    if (promoId) {
      const { error } = await supabase.from("promos").update(payload).eq("id", promoId);
      if (error) { setSaveError(error.message); return; }
    } else {
      const { data, error } = await supabase.from("promos").insert(payload).select("id").single();
      if (error || !data) { setSaveError(error?.message ?? "Save failed"); return; }
      promoId = data.id;
    }
    // rewrite slots
    await supabase.from("promo_assets").delete().eq("promo_id", promoId);
    if (picked.length) await supabase.from("promo_assets").insert(picked.map((asset_id, slot) => ({ promo_id: promoId, asset_id, slot })));
    setEditing(null); load();
  }

  const template = getTemplate(draft.template_key);

  function togglePick(id: string) {
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id);
      if (p.length >= template.maxImages) return p;
      return [...p, id];
    });
  }

  const aspectMatch = (draft.aspect_ratio ?? "").match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  const aspectW = aspectMatch ? aspectMatch[1] : "1.91";
  const aspectH = aspectMatch ? aspectMatch[2] : "1";
  function setCustomAspect(w: string, h: string) { setDraft({ ...draft, aspect_ratio: `${w}:${h}` }); }

  if (editing) {
    const previewUrls = picked.map((id) => thumbs[id]).filter(Boolean) as string[];
    const atMax = picked.length >= template.maxImages;
    const logoUrl = draft.logo_asset_id ? thumbs[draft.logo_asset_id] : undefined;
    return (
      <div className="my-3 grid gap-4 lg:grid-cols-2 items-start">
        <div className="panel p-4 grid gap-2">
          <div className="flex gap-2 flex-wrap">
            <input className="input flex-1" placeholder="promo name*" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <input className="input w-40" placeholder="angle" value={draft.angle ?? ""} onChange={(e) => setDraft({ ...draft, angle: e.target.value })} />
          </div>

          <div className="mono text-xs text-muted mt-2">aspect ratio</div>
          <div className="flex gap-2 flex-wrap items-center">
            {ASPECT_PRESETS.map((a) => (
              <button key={a} onClick={() => setDraft({ ...draft, aspect_ratio: a })}
                className={`btn text-sm ${draft.aspect_ratio === a ? "btn-primary" : "btn-ghost"}`}>
                {a}
              </button>
            ))}
            <span className="mono text-xs text-muted">custom</span>
            <input type="number" step="0.01" min="0.1" className="input w-16" value={aspectW} onChange={(e) => setCustomAspect(e.target.value, aspectH)} />
            <span className="mono text-xs text-muted">:</span>
            <input type="number" step="0.01" min="0.1" className="input w-16" value={aspectH} onChange={(e) => setCustomAspect(aspectW, e.target.value)} />
          </div>

          <div className="mono text-xs text-muted mt-2">brand mark — logo wins if set, otherwise the title text below</div>
          <input className="input" placeholder="brand title (e.g. David Casteel, Luxury Photography Production)" value={draft.brand_title ?? ""} onChange={(e) => setDraft({ ...draft, brand_title: e.target.value })} />
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
            {assets.map((a) => (
              <button key={a.id} onClick={() => setDraft({ ...draft, logo_asset_id: draft.logo_asset_id === a.id ? undefined : a.id })}
                className={`panel overflow-hidden relative ${draft.logo_asset_id === a.id ? "ring-2 ring-white" : ""}`}>
                {thumbs[a.id] && <img src={thumbs[a.id]} className="w-full h-14 object-cover" />}
              </button>
            ))}
          </div>

          <input className="input" placeholder="headline" value={draft.headline ?? ""} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} />
          <textarea className="input" placeholder="body copy" value={draft.body_copy ?? ""} onChange={(e) => setDraft({ ...draft, body_copy: e.target.value })} />
          <div className="mono text-xs text-muted mt-2">contact — shown exactly as typed, links open externally</div>
          <div className="flex gap-2 flex-wrap">
            <input className="input" placeholder="phone" value={draft.contact_phone ?? ""} onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })} />
            <input className="input" placeholder="link 1 (e.g. yoursite.com)" value={draft.link_url_1 ?? ""} onChange={(e) => setDraft({ ...draft, link_url_1: e.target.value })} />
            <input className="input" placeholder="link 2 (e.g. instagram.com/you)" value={draft.link_url_2 ?? ""} onChange={(e) => setDraft({ ...draft, link_url_2: e.target.value })} />
          </div>

          <div className="mono text-xs text-muted mt-2">style</div>
          <div className="flex gap-2 flex-wrap">
            <select className="input w-auto" value={draft.font_family ?? "hanken"} onChange={(e) => setDraft({ ...draft, font_family: e.target.value })}>
              {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select className="input w-auto" value={draft.font_size ?? "md"} onChange={(e) => setDraft({ ...draft, font_size: e.target.value })}>
              {FONT_SIZE_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label} text</option>)}
            </select>
            <select className="input w-auto" value={draft.padding ?? "md"} onChange={(e) => setDraft({ ...draft, padding: e.target.value })}>
              {PADDING_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label} padding</option>)}
            </select>
            <select className="input w-auto" value={draft.line_height ?? "normal"} onChange={(e) => setDraft({ ...draft, line_height: e.target.value })}>
              {LINE_HEIGHT_OPTIONS.map((l) => <option key={l.value} value={l.value}>{l.label} lines</option>)}
            </select>
          </div>

          <div className="mono text-xs text-muted mt-2">text placement</div>
          <div className="flex gap-2 flex-wrap">
            {TEXT_PLACEMENT_OPTIONS.map((t) => (
              <button key={t.value} onClick={() => setDraft({ ...draft, text_placement: t.value })}
                className={`btn text-sm ${(draft.text_placement ?? "bottom") === t.value ? "btn-primary" : "btn-ghost"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="mono text-xs text-muted mt-2">image anchor (within its zone, never cropped)</div>
          <div className="grid grid-cols-3 gap-1 w-40">
            {IMAGE_ANCHOR_OPTIONS.map((a) => (
              <button key={a.value} onClick={() => setDraft({ ...draft, image_anchor: a.value })} title={a.label}
                className={`btn text-xs h-9 ${(draft.image_anchor ?? "center center") === a.value ? "btn-primary" : "btn-ghost"}`}>
                •
              </button>
            ))}
          </div>

          <div className="mono text-xs text-muted mt-2">link preview (what LinkedIn shows)</div>
          <input className="input" placeholder="og title" value={draft.og_title ?? ""} onChange={(e) => setDraft({ ...draft, og_title: e.target.value })} />
          <input className="input" placeholder="og description" value={draft.og_description ?? ""} onChange={(e) => setDraft({ ...draft, og_description: e.target.value })} />

          <div className="mono text-xs text-muted mt-2">
            main image ({picked.length}/{template.maxImages} selected)
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
          {saveError && <p className="text-cold text-sm">{saveError}</p>}
          <div className="flex gap-2 mt-2">
            <button className="btn btn-ghost" onClick={() => save(false)}>Save draft</button>
            <button className="btn btn-primary" onClick={() => save(true)}>Save & publish</button>
            <button className="btn btn-ghost ml-auto" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>

        <div className="grid gap-2 lg:sticky lg:top-4">
          <div className="mono text-xs text-muted">preview — {draft.aspect_ratio}</div>
          <AspectFrame promo={draft}>
            <PromoRenderer promo={draft} imageUrls={previewUrls} logoUrl={logoUrl} />
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

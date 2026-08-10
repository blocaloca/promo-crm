"use client";
import { useEffect, useState, useCallback } from "react";
import { listPromos, getPromoAssetIds, savePromo, deletePromo } from "@/actions/promos";
import { listAssets } from "@/actions/media";
import {
  PromoRenderer, AspectFrame, getTemplate, DEFAULT_TEMPLATE_KEY,
  PROMO_TEMPLATES,
} from "@/components/promo-templates";
import type { PromoTemplateKey } from "@/components/promo-templates";
import type { Promo, Asset } from "@/lib/types";

// grey-box mini previews of each fixed layout — no real photos, just shape
function TemplateThumb({ templateKey }: { templateKey: PromoTemplateKey }) {
  const img = <div className="bg-edge flex-1 min-h-0 min-w-0" />;
  const brand = <div className="bg-muted/40 h-1.5 w-8 rounded-full" />;
  const contact = (stack: boolean) => (
    <div className={`flex ${stack ? "flex-col items-end" : ""} gap-1`}>
      <div className="bg-muted/40 h-1 w-6 rounded-full" />
      <div className="bg-muted/40 h-1 w-6 rounded-full" />
    </div>
  );
  switch (templateKey) {
    case "cover_centered":
      return (
        <div className="h-16 w-full flex flex-col gap-1 p-1.5 border border-edge rounded">
          <div className="bg-edge flex-[65] min-h-0" />
          <div className="flex-[35] min-h-0 flex flex-col items-center justify-center gap-1">
            {brand}
            <div className="flex gap-1">{contact(false)}</div>
          </div>
        </div>
      );
    case "split_centered":
      return (
        <div className="h-16 w-full flex gap-1 p-1.5 border border-edge rounded">
          <div className="bg-edge flex-[64] min-w-0" />
          <div className="flex-[36] min-w-0 flex flex-col items-end justify-center gap-1">
            {brand}
            {contact(true)}
          </div>
        </div>
      );
    case "cover_footer_bar":
      return (
        <div className="h-16 w-full flex flex-col gap-1 p-1.5 border border-edge rounded">
          <div className="bg-edge flex-[82] min-h-0" />
          <div className="flex-[18] min-h-0 flex items-start justify-between">
            {brand}
            {contact(true)}
          </div>
        </div>
      );
    case "split_footer_bar":
      return (
        <div className="h-16 w-full flex gap-1 p-1.5 border border-edge rounded">
          <div className="bg-edge flex-[52] min-w-0" />
          <div className="flex-[48] min-w-0 flex flex-col items-end justify-center gap-1">
            {brand}
            {contact(true)}
          </div>
        </div>
      );
    case "fullbleed_footer_bar":
      return (
        <div className="h-16 w-full flex flex-col gap-1 p-1.5 border border-edge rounded">
          <div className="bg-edge flex-[87] min-h-0" />
          <div className="flex-[13] min-h-0 flex items-start justify-between">
            {brand}
            {contact(true)}
          </div>
        </div>
      );
    case "full_image":
      return (
        <div className="h-16 w-full p-1.5 border border-edge rounded">
          <div className="bg-edge h-full w-full" />
        </div>
      );
  }
}

export default function Promos() {
  const [rows, setRows] = useState<Promo[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [saveError, setSaveError] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [draft, setDraft] = useState<Partial<Promo>>({ template_key: DEFAULT_TEMPLATE_KEY, aspect_ratio: getTemplate(DEFAULT_TEMPLATE_KEY).defaultAspectRatio ?? undefined });

  const load = useCallback(async () => {
    const [p, a] = await Promise.all([listPromos(), listAssets()]);
    setRows(p); setAssets(a);
  }, []);
  useEffect(() => { load(); }, [load]);

  const thumbs = Object.fromEntries(assets.map((a) => [a.id, a.thumb_path]));

  function startNew() {
    setEditing({} as Promo);
    setDraft({ template_key: DEFAULT_TEMPLATE_KEY, aspect_ratio: getTemplate(DEFAULT_TEMPLATE_KEY).defaultAspectRatio ?? undefined });
    setPicked([]);
  }
  async function edit(p: Promo) {
    setEditing(p); setDraft(p);
    setPicked(await getPromoAssetIds(p.id));
  }
  async function duplicate(p: Promo) {
    setPicked(await getPromoAssetIds(p.id));
    setEditing({} as Promo);
    setDraft({
      ...p,
      id: undefined,
      name: `${p.name} (copy)`,
      public_token: undefined,
      pdf_path: undefined,
      view_count: 0,
    });
  }
  async function del(p: Promo) {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    await deletePromo(p.id);
    load();
  }

  function pickTemplate(key: PromoTemplateKey) {
    const defaultAspectRatio = getTemplate(key).defaultAspectRatio;
    setDraft((d) => ({ ...d, template_key: key, aspect_ratio: defaultAspectRatio ?? d.aspect_ratio }));
  }

  // every save makes the promo live — there's no separate publish step, so a
  // promo is always shareable as soon as it has been saved once
  async function save(closeAfter: boolean) {
    if (!draft.name) { setSaveError("Promo name is required."); return; }
    setSaveError("");
    const { id, publicToken, error } = await savePromo({
      id: (editing as Promo)?.id,
      name: draft.name,
      template_key: draft.template_key ?? DEFAULT_TEMPLATE_KEY,
      aspect_ratio: draft.aspect_ratio ?? null,
      headline: draft.headline ?? null,
      body_copy: draft.body_copy ?? null,
      link_url_1: draft.link_url_1 ?? null,
      link_url_2: draft.link_url_2 ?? null,
      contact_phone: draft.contact_phone ?? null,
      angle: draft.angle ?? null,
      og_title: draft.og_title ?? null,
      og_description: draft.og_description ?? null,
      brand_title: draft.brand_title ?? null,
      logo_asset_id: draft.logo_asset_id ?? null,
      public_token: draft.public_token ?? null,
      assetIds: picked,
    });
    if (error) { setSaveError(error); return; }
    if (closeAfter) {
      setEditing(null);
    } else {
      // stay open — carry the assigned id/public_token forward so the next
      // save updates this row instead of inserting a duplicate
      const saved = { ...draft, id, public_token: publicToken, status: "published" } as Promo;
      setEditing(saved);
      setDraft(saved);
    }
    load();
  }

  const template = getTemplate(draft.template_key);

  function togglePick(id: string) {
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id);
      if (p.length >= template.maxImages) return p;
      return [...p, id];
    });
    if (template.key === "full_image" && !picked.includes(id)) {
      const asset = assets.find((a) => a.id === id);
      if (asset?.width && asset?.height) {
        setDraft((d) => ({ ...d, aspect_ratio: `${asset.width}:${asset.height}` }));
      }
    }
  }

  if (editing) {
    const previewUrls = picked.map((id) => thumbs[id]).filter(Boolean) as string[];
    const atMax = picked.length >= template.maxImages;
    const logoUrl = draft.logo_asset_id ? thumbs[draft.logo_asset_id] : undefined;
    return (
      <div className="my-3 grid gap-4 lg:grid-cols-2 items-start">
        <div className="panel p-4 grid gap-2">
          <div className="flex gap-2 flex-wrap">
            <input className="input flex-1" placeholder="promo name*" value={draft.name ?? ""} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            <input className="input w-40" placeholder="angle" value={draft.angle ?? ""} onChange={(e) => setDraft((d) => ({ ...d, angle: e.target.value }))} />
          </div>

          <div className="mono text-xs text-muted mt-2">template</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PROMO_TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => pickTemplate(t.key)}
                className={`text-left ${draft.template_key === t.key ? "ring-2 ring-white rounded" : ""}`}
                title={t.description}
              >
                <TemplateThumb templateKey={t.key} />
                <div className="text-xs mt-1">{t.label}</div>
              </button>
            ))}
          </div>

          {template.key === "full_image" ? (
            <p className="text-sm text-muted mt-2">
              Full Image ignores brand, headline, and contact fields — the uploaded image is the whole promo.
            </p>
          ) : (
            <>
              <div className="mono text-xs text-muted mt-2">brand mark — logo and title show together</div>
              <input className="input" placeholder="title (e.g. by David Casteel)" value={draft.brand_title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, brand_title: e.target.value }))} />
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {assets.map((a) => (
                  <button key={a.id} onClick={() => setDraft((d) => ({ ...d, logo_asset_id: d.logo_asset_id === a.id ? undefined : a.id }))}
                    className={`panel overflow-hidden relative ${draft.logo_asset_id === a.id ? "ring-2 ring-white" : ""}`}>
                    {thumbs[a.id] && <img src={thumbs[a.id]} className="w-full h-14 object-cover" />}
                  </button>
                ))}
              </div>

              <input className="input mt-2" placeholder="headline (optional)" value={draft.headline ?? ""} onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))} />
              <textarea className="input" placeholder="body copy (optional)" value={draft.body_copy ?? ""} onChange={(e) => setDraft((d) => ({ ...d, body_copy: e.target.value }))} />

              <div className="mono text-xs text-muted mt-2">contact — shown exactly as typed, links open externally</div>
              <div className="flex gap-2 flex-wrap">
                <input className="input" placeholder="phone" value={draft.contact_phone ?? ""} onChange={(e) => setDraft((d) => ({ ...d, contact_phone: e.target.value }))} />
                <input className="input" placeholder="link 1 (e.g. yoursite.com)" value={draft.link_url_1 ?? ""} onChange={(e) => setDraft((d) => ({ ...d, link_url_1: e.target.value }))} />
                <input className="input" placeholder="link 2 (e.g. instagram.com/you)" value={draft.link_url_2 ?? ""} onChange={(e) => setDraft((d) => ({ ...d, link_url_2: e.target.value }))} />
              </div>
            </>
          )}

          <div className="mono text-xs text-muted mt-2">link preview (what LinkedIn shows)</div>
          <input className="input" placeholder="og title" value={draft.og_title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, og_title: e.target.value }))} />
          <input className="input" placeholder="og description" value={draft.og_description ?? ""} onChange={(e) => setDraft((d) => ({ ...d, og_description: e.target.value }))} />

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
            <button className="btn btn-ghost" onClick={() => save(false)}>Save</button>
            <button className="btn btn-primary" onClick={() => save(true)}>Save and close</button>
            <button className="btn btn-ghost ml-auto" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>

        <div className="grid gap-2 lg:sticky lg:top-4">
          <div className="mono text-xs text-muted">preview — {template.label} ({template.defaultAspectRatio ?? draft.aspect_ratio ?? "from image"})</div>
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
              <button className="btn btn-ghost text-sm" onClick={() => duplicate(p)}>Duplicate</button>
              {p.public_token && (
                <>
                  <a className="btn btn-ghost text-sm" href={`/p/${p.public_token}`} target="_blank">View ↗</a>
                  <span className="mono text-xs text-muted">{p.view_count} views</span>
                </>
              )}
              <button className="btn btn-ghost text-sm ml-auto" onClick={() => del(p)}>Delete</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-muted text-sm p-4">No promos yet.</div>}
      </div>
    </div>
  );
}

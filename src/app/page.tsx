"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { getOrgId } from "@/lib/org";
import type { Prospect, ProspectState } from "@/lib/types";
import LogInteraction from "@/components/LogInteraction";

const STATES: ProspectState[] = ["prospect", "contacted", "in_convo", "booked", "dormant"];
const COLD_DAYS = 21;

function daysSince(d?: string) {
  if (!d) return Infinity;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

export default function Prospects() {
  const supabase = createClient();
  const [rows, setRows] = useState<Prospect[]>([]);
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [coldOnly, setColdOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<Prospect>>({ name: "", state: "prospect" });

  const load = useCallback(async () => {
    const org = await getOrgId(); if (!org) return;
    const { data } = await supabase.from("prospects").select("*").eq("org_id", org).order("last_touched", { ascending: true, nullsFirst: true });
    setRows(data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    const org = await getOrgId(); if (!org || !draft.name) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("prospects").insert({ ...draft, org_id: org, owner_id: user!.id });
    setDraft({ name: "", state: "prospect" }); setAdding(false); load();
  }
  async function setState(id: string, state: ProspectState) {
    await supabase.from("prospects").update({ state }).eq("id", id); load();
  }

  const filtered = rows.filter((r) => {
    if (q && !`${r.name} ${r.company ?? ""} ${r.region ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (stateFilter && r.state !== stateFilter) return false;
    if (coldOnly) {
      const cold = ["contacted", "in_convo"].includes(r.state) && daysSince(r.last_touched) >= COLD_DAYS;
      if (!cold) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap my-3">
        <input className="input flex-1 min-w-[160px]" placeholder="search name / company / region"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="">all states</option>
          {STATES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <button className={`btn ${coldOnly ? "btn-primary" : "btn-ghost"}`} onClick={() => setColdOnly(!coldOnly)}>
          Going cold
        </button>
        <button className="btn btn-primary" onClick={() => setAdding(!adding)}>+ Prospect</button>
      </div>

      {adding && (
        <div className="panel p-4 mb-3 grid gap-2 sm:grid-cols-3">
          <input className="input" placeholder="name*" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className="input" placeholder="title" value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <input className="input" placeholder="company" value={draft.company ?? ""} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
          <input className="input" placeholder="sector" value={draft.sector ?? ""} onChange={(e) => setDraft({ ...draft, sector: e.target.value })} />
          <input className="input" placeholder="region" value={draft.region ?? ""} onChange={(e) => setDraft({ ...draft, region: e.target.value })} />
          <input className="input" placeholder="linkedin url" value={draft.linkedin_url ?? ""} onChange={(e) => setDraft({ ...draft, linkedin_url: e.target.value })} />
          <div className="sm:col-span-3 flex gap-2">
            <button className="btn btn-primary" onClick={save}>Save</button>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {filtered.map((r) => {
          const cold = ["contacted", "in_convo"].includes(r.state) && daysSince(r.last_touched) >= COLD_DAYS;
          return (
            <div key={r.id} className="panel p-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <div className="font-semibold">{r.name}
                    {cold && <span className="chip ml-2 text-cold border-cold">cold</span>}
                  </div>
                  <div className="text-sm text-muted">{[r.title, r.company, r.region].filter(Boolean).join(" · ")}</div>
                </div>
                <select className="input w-auto text-sm" value={r.state} onChange={(e) => setState(r.id, e.target.value as ProspectState)}>
                  {STATES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
                <span className="mono text-xs text-muted">{r.last_touched ? `${daysSince(r.last_touched)}d` : "—"}</span>
                <button className="btn btn-ghost text-sm" onClick={() => setOpen(open === r.id ? null : r.id)}>
                  {open === r.id ? "Close" : "Reach out"}
                </button>
              </div>
              {open === r.id && (
                <div className="mt-3">
                  {r.linkedin_url && <a href={r.linkedin_url} target="_blank" className="mono text-xs text-muted underline block mb-2">open LinkedIn ↗</a>}
                  <LogInteraction prospectId={r.id} compact onLogged={load} />
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-muted text-sm p-4">No prospects match.</div>}
      </div>
    </div>
  );
}

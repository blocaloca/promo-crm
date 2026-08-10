"use client";
import { useEffect, useState, useCallback } from "react";
import {
  listProspects, createProspect, updateProspectState, updateProspect, deleteProspect,
} from "@/actions/prospects";
import { listListsBasic, getListMembershipMap, addToList, removeFromList } from "@/actions/lists";
import type { Prospect, ProspectState, ListRow } from "@/lib/types";
import LogInteraction from "@/components/LogInteraction";

const STATES: ProspectState[] = ["prospect", "contacted", "in_convo", "booked", "dormant"];
const COLD_DAYS = 21;

function daysSince(d?: string) {
  if (!d) return Infinity;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

function csvEscape(v: string) {
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

export default function Prospects() {
  const [rows, setRows] = useState<Prospect[]>([]);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [coldOnly, setColdOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<Prospect>>({ name: "", state: "prospect" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Prospect>>({});

  const load = useCallback(async () => {
    const sortNewest = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("sort") === "newest";
    const [data, ls, mem] = await Promise.all([listProspects(sortNewest), listListsBasic(), getListMembershipMap()]);
    setRows(data);
    setLists(ls);
    setMemberships(mem);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!draft.name) return;
    await createProspect(draft);
    setDraft({ name: "", state: "prospect" }); setAdding(false); load();
  }
  async function setState(id: string, state: ProspectState) {
    await updateProspectState(id, state); load();
  }
  function startEdit(r: Prospect) { setEditingId(r.id); setEditDraft({ ...r }); setOpen(null); }
  function cancelEdit() { setEditingId(null); setEditDraft({}); }
  async function saveEdit() {
    if (!editingId || !editDraft.name) return;
    await updateProspect(editingId, editDraft);
    setEditingId(null); setEditDraft({}); load();
  }
  async function deleteProspectRow(id: string) {
    if (!window.confirm("Delete this prospect? This also removes their interaction history and list memberships. This can't be undone.")) return;
    await deleteProspect(id);
    setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
    if (open === id) setOpen(null);
    if (editingId === id) cancelEdit();
    load();
  }
  async function addToListRow(prospectId: string, listId: string) {
    if (!listId) return;
    await addToList(prospectId, listId);
    load();
  }
  async function removeFromListRow(prospectId: string, listId: string) {
    await removeFromList(prospectId, listId);
    load();
  }
  function toggleSelected(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function exportCsv() {
    const chosen = rows.filter((r) => selected.has(r.id));
    const lines = ["Name,Email", ...chosen.map((r) => `${csvEscape(r.name)},${csvEscape(r.email ?? "")}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "prospects.csv"; a.click();
    URL.revokeObjectURL(url);
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
        {selected.size > 0 && (
          <button className="btn btn-ghost" onClick={exportCsv}>Export CSV ({selected.size})</button>
        )}
        <button className="btn btn-primary" onClick={() => setAdding(!adding)}>+ Prospect</button>
        <a href="/prospects/import" className="btn btn-ghost">Import CSV</a>
      </div>

      {adding && (
        <div className="panel p-4 mb-3 grid gap-2 sm:grid-cols-3">
          <input className="input" placeholder="name*" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className="input" placeholder="title" value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <input className="input" placeholder="company" value={draft.company ?? ""} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
          <input className="input" placeholder="sector" value={draft.sector ?? ""} onChange={(e) => setDraft({ ...draft, sector: e.target.value })} />
          <input className="input" placeholder="region" value={draft.region ?? ""} onChange={(e) => setDraft({ ...draft, region: e.target.value })} />
          <input className="input" placeholder="linkedin url" value={draft.linkedin_url ?? ""} onChange={(e) => setDraft({ ...draft, linkedin_url: e.target.value })} />
          <input className="input" placeholder="email" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          <input className="input" placeholder="phone" value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          <div className="sm:col-span-3 flex gap-2">
            <button className="btn btn-primary" onClick={save}>Save</button>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {filtered.map((r) => {
          const cold = ["contacted", "in_convo"].includes(r.state) && daysSince(r.last_touched) >= COLD_DAYS;
          const memberListIds = memberships[r.id] ?? [];
          const availableLists = lists.filter((l) => !memberListIds.includes(l.id));
          return (
            <div key={r.id} className="panel p-3">
              <div className="flex items-center gap-3 flex-wrap">
                <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelected(r.id)} />
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
                <button className="btn btn-ghost text-sm" onClick={() => (editingId === r.id ? cancelEdit() : startEdit(r))}>
                  {editingId === r.id ? "Cancel" : "Edit"}
                </button>
                <button className="btn btn-ghost text-sm" onClick={() => deleteProspectRow(r.id)}>Delete</button>
              </div>

              <div className="flex items-center gap-1 flex-wrap mt-2">
                {memberListIds.map((lid) => {
                  const l = lists.find((x) => x.id === lid);
                  if (!l) return null;
                  return (
                    <span key={lid} className="chip text-muted flex items-center gap-1">
                      {l.name}
                      <button onClick={() => removeFromListRow(r.id, lid)} className="hover:text-cold" aria-label={`remove from ${l.name}`}>×</button>
                    </span>
                  );
                })}
                {availableLists.length > 0 && (
                  <select className="input w-auto text-xs" value="" onChange={(e) => addToListRow(r.id, e.target.value)}>
                    <option value="">+ add to list…</option>
                    {availableLists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                )}
              </div>

              {open === r.id && (
                <div className="mt-3 grid gap-2">
                  <div className="flex gap-3 flex-wrap text-xs mono text-muted">
                    {r.linkedin_url && <a href={r.linkedin_url} target="_blank" className="underline">open LinkedIn ↗</a>}
                    {r.email && <a href={`mailto:${r.email}`} className="underline">{r.email}</a>}
                    {r.phone && <a href={`tel:${r.phone}`} className="underline">{r.phone}</a>}
                  </div>
                  <LogInteraction prospectId={r.id} compact onLogged={load} />
                </div>
              )}

              {editingId === r.id && (
                <div className="mt-3 panel p-3 grid gap-2 sm:grid-cols-3">
                  <input className="input" placeholder="name*" value={editDraft.name ?? ""} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
                  <input className="input" placeholder="title" value={editDraft.title ?? ""} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} />
                  <input className="input" placeholder="company" value={editDraft.company ?? ""} onChange={(e) => setEditDraft({ ...editDraft, company: e.target.value })} />
                  <input className="input" placeholder="sector" value={editDraft.sector ?? ""} onChange={(e) => setEditDraft({ ...editDraft, sector: e.target.value })} />
                  <input className="input" placeholder="region" value={editDraft.region ?? ""} onChange={(e) => setEditDraft({ ...editDraft, region: e.target.value })} />
                  <input className="input" placeholder="tier" value={editDraft.tier ?? ""} onChange={(e) => setEditDraft({ ...editDraft, tier: e.target.value })} />
                  <input className="input" placeholder="linkedin url" value={editDraft.linkedin_url ?? ""} onChange={(e) => setEditDraft({ ...editDraft, linkedin_url: e.target.value })} />
                  <input className="input" placeholder="email" value={editDraft.email ?? ""} onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })} />
                  <input className="input" placeholder="phone" value={editDraft.phone ?? ""} onChange={(e) => setEditDraft({ ...editDraft, phone: e.target.value })} />
                  <textarea className="input sm:col-span-3" placeholder="notes" value={editDraft.notes ?? ""} onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })} />
                  <label className="flex items-center gap-2 text-sm sm:col-span-3">
                    <input type="checkbox" checked={editDraft.south_america_relevant ?? false}
                      onChange={(e) => setEditDraft({ ...editDraft, south_america_relevant: e.target.checked })} />
                    South America relevant
                  </label>
                  <div className="sm:col-span-3 flex gap-2">
                    <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                    <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
                  </div>
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

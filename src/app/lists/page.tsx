"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { getOrgId } from "@/lib/org";
import type { ListRow, Prospect } from "@/lib/types";

export default function Lists() {
  const supabase = createClient();
  const [lists, setLists] = useState<(ListRow & { count: number; done: number })[]>([]);
  const [name, setName] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);
  const [members, setMembers] = useState<Prospect[]>([]);

  const load = useCallback(async () => {
    const org = await getOrgId(); if (!org) return;
    const { data: ls } = await supabase.from("lists").select("*").eq("org_id", org).order("created_at", { ascending: false });
    const withCounts = await Promise.all((ls ?? []).map(async (l) => {
      const { data: m } = await supabase.from("list_members").select("done").eq("list_id", l.id);
      return { ...l, count: m?.length ?? 0, done: (m ?? []).filter((x) => x.done).length };
    }));
    setLists(withCounts);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    const org = await getOrgId(); if (!org || !name) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("lists").insert({ org_id: org, owner_id: user!.id, name });
    setName(""); load();
  }
  async function openView(listId: string) {
    setViewing(viewing === listId ? null : listId);
    if (viewing === listId) return;
    const { data: lm } = await supabase.from("list_members").select("prospect_id").eq("list_id", listId).order("position");
    const ids = (lm ?? []).map((r) => r.prospect_id);
    if (!ids.length) { setMembers([]); return; }
    const { data: ps } = await supabase.from("prospects").select("*").in("id", ids);
    setMembers(ids.map((id) => ps?.find((p) => p.id === id)).filter(Boolean) as Prospect[]);
  }
  async function removeMember(listId: string, prospectId: string) {
    await supabase.from("list_members").delete().eq("list_id", listId).eq("prospect_id", prospectId);
    setMembers((m) => m.filter((p) => p.id !== prospectId));
    load();
  }
  async function del(id: string) { await supabase.from("lists").delete().eq("id", id); if (viewing === id) setViewing(null); load(); }

  return (
    <div>
      <div className="panel p-4 my-3 flex gap-2">
        <input className="input" placeholder="new worklist name (e.g. Miami Hospitality Q3)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary" onClick={create}>Create</button>
      </div>
      <div className="text-xs text-muted mb-2">Add prospects to a list from the Prospects page — this view just shows who's already in each list.</div>
      <div className="grid gap-2">
        {lists.map((l) => (
          <div key={l.id} className="panel p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{l.name}</span>
              <span className="mono text-xs text-muted">{l.done}/{l.count} done</span>
              <div className="ml-auto flex gap-2">
                <button className="btn btn-ghost text-sm" onClick={() => openView(l.id)}>{viewing === l.id ? "Close" : "View"}</button>
                <Link href={`/lists/${l.id}/run`} className="btn btn-primary text-sm">Run ▶</Link>
                <button className="btn btn-ghost text-sm" onClick={() => del(l.id)}>Delete</button>
              </div>
            </div>
            {viewing === l.id && (
              <div className="mt-3 grid gap-1 max-h-72 overflow-auto">
                {members.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-edge">
                    <span className="flex-1">{p.name}</span>
                    <span className="text-muted text-xs">{[p.company, p.region].filter(Boolean).join(" · ")}</span>
                    <button className="btn btn-ghost text-xs" onClick={() => removeMember(l.id, p.id)}>Remove</button>
                  </div>
                ))}
                {members.length === 0 && <div className="text-muted text-sm p-2">No prospects in this list yet.</div>}
              </div>
            )}
          </div>
        ))}
        {lists.length === 0 && <div className="text-muted text-sm p-4">No worklists yet.</div>}
      </div>
    </div>
  );
}

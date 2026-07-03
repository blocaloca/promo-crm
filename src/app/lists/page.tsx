"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { getOrgId } from "@/lib/org";
import type { ListRow, Prospect } from "@/lib/types";

export default function Lists() {
  const supabase = createClient();
  const [lists, setLists] = useState<(ListRow & { count: number; done: number })[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [name, setName] = useState("");
  const [managing, setManaging] = useState<string | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const org = await getOrgId(); if (!org) return;
    const { data: ls } = await supabase.from("lists").select("*").eq("org_id", org).order("created_at", { ascending: false });
    const withCounts = await Promise.all((ls ?? []).map(async (l) => {
      const { data: m } = await supabase.from("list_members").select("done").eq("list_id", l.id);
      return { ...l, count: m?.length ?? 0, done: (m ?? []).filter((x) => x.done).length };
    }));
    setLists(withCounts);
    const { data: p } = await supabase.from("prospects").select("*").eq("org_id", org).order("name");
    setProspects(p ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    const org = await getOrgId(); if (!org || !name) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("lists").insert({ org_id: org, owner_id: user!.id, name });
    setName(""); load();
  }
  async function openManage(listId: string) {
    setManaging(listId);
    const { data } = await supabase.from("list_members").select("prospect_id").eq("list_id", listId);
    setMembers((data ?? []).map((r) => r.prospect_id));
  }
  async function toggleMember(listId: string, prospectId: string) {
    if (members.includes(prospectId)) {
      await supabase.from("list_members").delete().eq("list_id", listId).eq("prospect_id", prospectId);
      setMembers((m) => m.filter((x) => x !== prospectId));
    } else {
      await supabase.from("list_members").insert({ list_id: listId, prospect_id: prospectId, position: members.length });
      setMembers((m) => [...m, prospectId]);
    }
    load();
  }
  async function del(id: string) { await supabase.from("lists").delete().eq("id", id); if (managing === id) setManaging(null); load(); }

  return (
    <div>
      <div className="panel p-4 my-3 flex gap-2">
        <input className="input" placeholder="new worklist name (e.g. Miami Hospitality Q3)" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary" onClick={create}>Create</button>
      </div>
      <div className="grid gap-2">
        {lists.map((l) => (
          <div key={l.id} className="panel p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{l.name}</span>
              <span className="mono text-xs text-muted">{l.done}/{l.count} done</span>
              <div className="ml-auto flex gap-2">
                <button className="btn btn-ghost text-sm" onClick={() => openManage(l.id)}>Manage</button>
                <Link href={`/lists/${l.id}/run`} className="btn btn-primary text-sm">Run ▶</Link>
                <button className="btn btn-ghost text-sm" onClick={() => del(l.id)}>Delete</button>
              </div>
            </div>
            {managing === l.id && (
              <div className="mt-3">
                <input className="input mb-2" placeholder="filter prospects" value={q} onChange={(e) => setQ(e.target.value)} />
                <div className="grid gap-1 max-h-72 overflow-auto">
                  {prospects.filter((p) => `${p.name} ${p.company ?? ""} ${p.sector ?? ""} ${p.region ?? ""}`.toLowerCase().includes(q.toLowerCase())).map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-edge cursor-pointer">
                      <input type="checkbox" checked={members.includes(p.id)} onChange={() => toggleMember(l.id, p.id)} />
                      <span>{p.name}</span>
                      <span className="text-muted text-xs">{[p.company, p.region].filter(Boolean).join(" · ")}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {lists.length === 0 && <div className="text-muted text-sm p-4">No worklists yet.</div>}
      </div>
    </div>
  );
}

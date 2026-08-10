"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listListsWithCounts, createList, deleteList, getListMembers, removeFromList } from "@/actions/lists";
import type { ListRow, Prospect } from "@/lib/types";

export default function Lists() {
  const [lists, setLists] = useState<(ListRow & { count: number; done: number })[]>([]);
  const [name, setName] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);
  const [members, setMembers] = useState<Prospect[]>([]);

  const load = useCallback(async () => {
    setLists(await listListsWithCounts());
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!name) return;
    await createList(name);
    setName(""); load();
  }
  async function openView(listId: string) {
    setViewing(viewing === listId ? null : listId);
    if (viewing === listId) return;
    setMembers(await getListMembers(listId));
  }
  async function removeMember(listId: string, prospectId: string) {
    await removeFromList(prospectId, listId);
    setMembers((m) => m.filter((p) => p.id !== prospectId));
    load();
  }
  async function del(id: string) { await deleteList(id); if (viewing === id) setViewing(null); load(); }

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

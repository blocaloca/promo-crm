"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { getOrgId } from "@/lib/org";
import type { Message, MsgType } from "@/lib/types";

const TYPES: MsgType[] = ["intro", "follow_up", "industry", "referral", "reengage"];

export default function Messages() {
  const supabase = createClient();
  const [rows, setRows] = useState<Message[]>([]);
  const [draft, setDraft] = useState<Partial<Message>>({ msg_type: "intro" });
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const org = await getOrgId(); if (!org) return;
    const { data } = await supabase.from("messages").select("*").eq("org_id", org).order("msg_type");
    setRows(data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    const org = await getOrgId(); if (!org || !draft.label || !draft.body) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (editing) await supabase.from("messages").update(draft).eq("id", editing);
    else await supabase.from("messages").insert({ ...draft, org_id: org, owner_id: user!.id });
    setDraft({ msg_type: "intro" }); setEditing(null); load();
  }
  async function del(id: string) { await supabase.from("messages").delete().eq("id", id); load(); }

  return (
    <div>
      <div className="panel p-4 my-3 grid gap-2">
        <div className="flex gap-2">
          <input className="input" placeholder="label" value={draft.label ?? ""} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          <select className="input w-auto" value={draft.msg_type} onChange={(e) => setDraft({ ...draft, msg_type: e.target.value as MsgType })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="input w-40" placeholder="sector (opt)" value={draft.sector ?? ""} onChange={(e) => setDraft({ ...draft, sector: e.target.value })} />
        </div>
        <textarea className="input min-h-[90px]" placeholder="message copy — plain, DM-length" value={draft.body ?? ""} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={save}>{editing ? "Update" : "Add message"}</button>
          {editing && <button className="btn btn-ghost" onClick={() => { setDraft({ msg_type: "intro" }); setEditing(null); }}>Cancel</button>}
        </div>
      </div>
      <div className="grid gap-2">
        {TYPES.map((t) => {
          const group = rows.filter((r) => r.msg_type === t);
          if (!group.length) return null;
          return (
            <div key={t}>
              <div className="mono text-xs text-muted mt-3 mb-1">{t}</div>
              {group.map((m) => (
                <div key={m.id} className="panel p-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{m.label}</span>
                    {m.sector && <span className="chip text-muted">{m.sector}</span>}
                    <button className="btn btn-ghost text-xs ml-auto" onClick={() => { setDraft(m); setEditing(m.id); }}>Edit</button>
                    <button className="btn btn-ghost text-xs" onClick={() => del(m.id)}>Delete</button>
                  </div>
                  <div className="text-sm text-muted whitespace-pre-wrap mt-1">{m.body}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { Prospect } from "@/lib/types";
import LogInteraction from "@/components/LogInteraction";

type Member = Prospect & { done: boolean; position: number | null };

export default function RunList() {
  const supabase = createClient();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [idx, setIdx] = useState(0);

  const load = useCallback(async () => {
    const { data: list } = await supabase.from("lists").select("name").eq("id", id).single();
    setName(list?.name ?? "");
    const { data: lm } = await supabase.from("list_members").select("prospect_id, done, position").eq("list_id", id).order("position", { nullsFirst: false });
    const ids = (lm ?? []).map((r) => r.prospect_id);
    if (!ids.length) { setMembers([]); return; }
    const { data: ps } = await supabase.from("prospects").select("*").in("id", ids);
    const merged = (lm ?? []).map((m) => ({ ...(ps?.find((p) => p.id === m.prospect_id) as Prospect), done: m.done, position: m.position }));
    setMembers(merged);
    const firstUndone = merged.findIndex((m) => !m.done);
    setIdx(firstUndone === -1 ? 0 : firstUndone);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const current = members[idx];
  const doneCount = members.filter((m) => m.done).length;

  async function markDoneAndAdvance() {
    if (!current) return;
    await supabase.from("list_members").update({ done: true }).eq("list_id", id).eq("prospect_id", current.id);
    setMembers((ms) => ms.map((m) => m.id === current.id ? { ...m, done: true } : m));
    const next = members.findIndex((m, i) => i > idx && !m.done);
    if (next !== -1) setIdx(next);
    else { const anyUndone = members.findIndex((m) => !m.done && m.id !== current.id); setIdx(anyUndone === -1 ? idx : anyUndone); }
  }

  if (!members.length) return (
    <div className="my-6 text-muted">
      <button className="btn btn-ghost mb-4" onClick={() => router.push("/lists")}>← Lists</button>
      <p>This list has no prospects. Add some from Manage.</p>
    </div>
  );

  return (
    <div className="my-3">
      <div className="flex items-center gap-3 mb-3">
        <button className="btn btn-ghost text-sm" onClick={() => router.push("/lists")}>← Lists</button>
        <span className="font-semibold">{name}</span>
        <span className="mono text-xs text-muted ml-auto">{doneCount}/{members.length} done · on {idx + 1}</span>
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        {members.map((m, i) => (
          <button key={m.id} onClick={() => setIdx(i)}
            className={`h-2 flex-1 min-w-[8px] rounded ${m.done ? "bg-ok" : i === idx ? "bg-text" : "bg-edge"}`} title={m.name} />
        ))}
      </div>

      {current && (
        <div className="panel p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div>
              <div className="text-lg font-semibold">{current.name} {current.done && <span className="chip text-ok border-ok ml-1">done</span>}</div>
              <div className="text-sm text-muted">{[current.title, current.company, current.region].filter(Boolean).join(" · ")}</div>
            </div>
            <div className="ml-auto flex gap-2">
              <button className="btn btn-ghost text-sm" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>Prev</button>
              <button className="btn btn-ghost text-sm" onClick={() => setIdx(Math.min(members.length - 1, idx + 1))} disabled={idx === members.length - 1}>Skip</button>
            </div>
          </div>
          {current.linkedin_url && <a href={current.linkedin_url} target="_blank" className="mono text-xs text-muted underline block mt-2">open LinkedIn ↗</a>}

          <div className="mt-3"><LogInteraction prospectId={current.id} compact onLogged={markDoneAndAdvance} /></div>
          <div className="mt-2 text-xs text-muted">Logging a send marks this prospect done and advances to the next.</div>
        </div>
      )}
    </div>
  );
}

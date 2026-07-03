"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { getOrgId } from "@/lib/org";
import type { Promo, Message, Channel } from "@/lib/types";

const CHANNELS: Channel[] = ["linkedin_dm", "email", "ig_dm", "call", "other"];

export default function LogInteraction({
  prospectId, onLogged, compact,
}: { prospectId: string; onLogged?: () => void; compact?: boolean }) {
  const supabase = createClient();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [promoId, setPromoId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [channel, setChannel] = useState<Channel>("linkedin_dm");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const org = await getOrgId(); if (!org) return;
      const { data: p } = await supabase.from("promos").select("*").eq("org_id", org).order("created_at", { ascending: false });
      const { data: m } = await supabase.from("messages").select("*").eq("org_id", org).order("created_at", { ascending: false });
      setPromos(p ?? []); setMessages(m ?? []);
    })();
  }, []);

  const promo = promos.find((p) => p.id === promoId);
  const message = messages.find((m) => m.id === messageId);
  const link = promo?.public_token ? `${location.origin}/p/${promo.public_token}` : "";

  async function copyOutreach() {
    const parts = [message?.body ?? "", link].filter(Boolean);
    await navigator.clipboard.writeText(parts.join("\n\n"));
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  async function log() {
    const org = await getOrgId(); if (!org) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("interactions").insert({
      org_id: org, owner_id: user!.id, prospect_id: prospectId,
      promo_id: promoId || null, message_id: messageId || null,
      channel, direction: "outbound", note: note || null,
    });
    setNote(""); onLogged?.();
  }

  return (
    <div className={compact ? "" : "panel p-4"}>
      <div className="grid gap-2 sm:grid-cols-2">
        <select className="input" value={promoId} onChange={(e) => setPromoId(e.target.value)}>
          <option value="">— promo —</option>
          {promos.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input" value={messageId} onChange={(e) => setMessageId(e.target.value)}>
          <option value="">— message —</option>
          {messages.map((m) => <option key={m.id} value={m.id}>{m.label} · {m.msg_type}</option>)}
        </select>
        <select className="input" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
          {CHANNELS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
        </select>
        <input className="input" placeholder="note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {message && (
        <div className="mt-2 text-sm text-muted whitespace-pre-wrap border-l-2 border-edge pl-3">{message.body}</div>
      )}
      <div className="flex gap-2 mt-3 flex-wrap">
        <button className="btn btn-ghost" onClick={copyOutreach} disabled={!message && !link}>
          {copied ? "Copied ✓" : "Copy message + link"}
        </button>
        <button className="btn btn-primary" onClick={log}>Log send</button>
      </div>
    </div>
  );
}

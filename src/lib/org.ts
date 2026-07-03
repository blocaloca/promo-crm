"use client";
import { createClient } from "./supabase-browser";

let cached: string | null = null;
export async function getOrgId(): Promise<string | null> {
  if (cached) return cached;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).limit(1).single();
  cached = data?.org_id ?? null;
  return cached;
}

// first login for a user bootstraps their own org — RLS allows any authenticated
// user to insert an org and add themselves as a member (see 0001_init.sql).
// the org id is generated here (not read back via .select()) because RETURNING
// rows are filtered by the orgs SELECT policy (is_org_member), which is still
// false for this org until the org_members row below is inserted.
export async function ensureOrg(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: mem } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).limit(1);
  if (mem && mem.length > 0) return;
  const orgId = crypto.randomUUID();
  const { error } = await supabase.from("orgs").insert({ id: orgId, name: "My Studio" });
  if (!error) await supabase.from("org_members").insert({ org_id: orgId, user_id: user.id, role: "owner" });
}

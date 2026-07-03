import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const supabase = createClient();
  if (code) await supabase.auth.exchangeCodeForSession(code);

  // ensure the user has an org (bootstrap: first login creates one).
  // the org id is generated here, not read back via .select(), because RETURNING
  // rows are filtered by the orgs SELECT policy (is_org_member), which is still
  // false for this org until the org_members row below is inserted.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: mem } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).limit(1);
    if (!mem || mem.length === 0) {
      const orgId = crypto.randomUUID();
      const { error } = await supabase.from("orgs").insert({ id: orgId, name: "My Studio" });
      if (!error) await supabase.from("org_members").insert({ org_id: orgId, user_id: user.id, role: "owner" });
    }
  }
  return NextResponse.redirect(new URL("/", url.origin));
}

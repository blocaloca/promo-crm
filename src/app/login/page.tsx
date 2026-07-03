"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { ensureOrg } from "@/lib/org";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const [err, setErr] = useState("");
  const supabase = createClient();

  async function submit() {
    setErr(""); setPending(true);
    const { data, error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
    setPending(false);
    if (error) { setErr(error.message); return; }
    if (!data.session) { setConfirmPending(true); return; } // sign-up needs email confirmation
    await ensureOrg();
    router.push("/");
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="panel w-full max-w-sm p-7">
        <div className="mono text-xs text-muted mb-1">promo crm</div>
        <h1 className="text-xl font-semibold mb-5">{mode === "signin" ? "Sign in" : "Create account"}</h1>
        {confirmPending ? (
          <p className="text-sm text-muted">Check your email to confirm your account, then sign in.</p>
        ) : (
          <>
            <input className="input mb-3" placeholder="you@studio.com" value={email}
              onChange={(e) => setEmail(e.target.value)} />
            <input className="input mb-3" placeholder="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} />
            <button className="btn btn-primary w-full" disabled={pending} onClick={submit}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
            <button className="btn btn-ghost w-full mt-2" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(""); }}>
              {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
            </button>
            {err && <p className="text-cold text-sm mt-3">{err}</p>}
          </>
        )}
      </div>
    </main>
  );
}

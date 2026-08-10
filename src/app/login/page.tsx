"use client";
import { useState } from "react";
import { login } from "@/actions/auth";

export default function Login() {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    setPending(true);
    const formData = new FormData();
    formData.set("password", password);
    const result = await login(formData);
    setPending(false);
    if (result?.error) setErr(result.error);
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="panel w-full max-w-sm p-7">
        <div className="mono text-xs text-muted mb-1">promo crm</div>
        <h1 className="text-xl font-semibold mb-5">Sign in</h1>
        <input
          className="input mb-3"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <button className="btn btn-primary w-full" disabled={pending} onClick={submit}>
          Sign in
        </button>
        {err && <p className="text-cold text-sm mt-3">{err}</p>}
      </div>
    </main>
  );
}

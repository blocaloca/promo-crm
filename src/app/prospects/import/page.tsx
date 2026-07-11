"use client";
import { useRef, useState } from "react";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase-browser";
import { getOrgId } from "@/lib/org";
import type { Prospect } from "@/lib/types";

const KNOWN_FIELDS = [
  "name", "title", "company", "sector", "region", "tier",
  "linkedin_url", "email", "instagram", "south_america_relevant", "notes",
] as const;
type KnownField = (typeof KNOWN_FIELDS)[number];

interface ParsedRow {
  name: string;
  title?: string; company?: string; sector?: string; region?: string; tier?: string;
  linkedin_url?: string; email?: string; instagram?: string; notes?: string;
  south_america_relevant: boolean;
  missingName: boolean;
  duplicateOf: Pick<Prospect, "id" | "name" | "company"> | null;
  skipDuplicate: boolean;
  formattingIssue: boolean;
}

type ExistingProspect = Pick<Prospect, "id" | "name" | "company" | "linkedin_url">;

function norm(v?: string | null) {
  return (v ?? "").trim().toLowerCase();
}
function coerceBool(v?: string) {
  const s = norm(v);
  return s === "true" || s === "yes" || s === "1";
}
function clean(v?: string) {
  const t = (v ?? "").trim();
  return t || undefined;
}

// header row required, matched by name case-insensitively — order doesn't
// matter, unrecognized columns are ignored rather than erroring
function normalizeHeaders(raw: Record<string, string>): Partial<Record<KnownField, string>> {
  const out: Partial<Record<KnownField, string>> = {};
  for (const [key, value] of Object.entries(raw)) {
    const k = key.trim().toLowerCase() as KnownField;
    if ((KNOWN_FIELDS as readonly string[]).includes(k)) out[k] = value;
  }
  return out;
}

function findDuplicate(row: ParsedRow, existing: ExistingProspect[]): ExistingProspect | null {
  const linkedin = norm(row.linkedin_url);
  if (linkedin) {
    const match = existing.find((e) => norm(e.linkedin_url) === linkedin);
    if (match) return match;
  }
  const name = norm(row.name);
  const company = norm(row.company);
  if (name && company) {
    const match = existing.find((e) => norm(e.name) === name && norm(e.company) === company);
    if (match) return match;
  }
  return null;
}

export default function ImportProspects() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ added: number; skippedDuplicate: number; skippedMissingName: number } | null>(null);

  async function onFile(file: File) {
    setError("");
    setResult(null);
    setRows(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // a row with more fields than the header (e.g. an unescaped comma
        // inside an unquoted value) gets silently truncated by Papaparse —
        // flag it instead of quietly losing part of that row's data
        const rowsWithIssues = new Set(results.errors.map((e) => e.row).filter((r): r is number => r != null));
        const parsed: ParsedRow[] = results.data.map((raw, i) => {
          const f = normalizeHeaders(raw);
          const name = (f.name ?? "").trim();
          return {
            name,
            title: clean(f.title), company: clean(f.company), sector: clean(f.sector),
            region: clean(f.region), tier: clean(f.tier), linkedin_url: clean(f.linkedin_url),
            email: clean(f.email), instagram: clean(f.instagram), notes: clean(f.notes),
            south_america_relevant: coerceBool(f.south_america_relevant),
            missingName: !name,
            duplicateOf: null,
            skipDuplicate: false,
            formattingIssue: rowsWithIssues.has(i),
          };
        });
        setRows(parsed);
        await checkDuplicates(parsed);
      },
      error: (err) => setError(err.message),
    });
  }

  async function checkDuplicates(parsed: ParsedRow[]) {
    setChecking(true);
    const org = await getOrgId();
    if (!org) { setChecking(false); return; }
    const { data: existing } = await supabase.from("prospects").select("id, name, company, linkedin_url").eq("org_id", org);
    setRows(
      parsed.map((r) => {
        if (r.missingName) return r;
        const dup = findDuplicate(r, existing ?? []);
        return dup ? { ...r, duplicateOf: dup, skipDuplicate: true } : r;
      })
    );
    setChecking(false);
  }

  function toggleSkip(i: number) {
    setRows((rs) => rs && rs.map((r, idx) => (idx === i ? { ...r, skipDuplicate: !r.skipDuplicate } : r)));
  }

  async function doImport() {
    if (!rows) return;
    setImporting(true);
    setError("");
    const org = await getOrgId();
    const { data: { user } } = await supabase.auth.getUser();
    if (!org || !user) { setError("Couldn't determine your organization — try refreshing."); setImporting(false); return; }

    const toInsert = rows.filter((r) => !r.missingName && !(r.duplicateOf && r.skipDuplicate));
    const skippedDuplicate = rows.filter((r) => r.duplicateOf && r.skipDuplicate).length;
    const skippedMissingName = rows.filter((r) => r.missingName).length;

    if (toInsert.length) {
      const payload = toInsert.map((r) => ({
        org_id: org, owner_id: user.id,
        name: r.name, title: r.title ?? null, company: r.company ?? null, sector: r.sector ?? null,
        region: r.region ?? null, tier: r.tier ?? null, linkedin_url: r.linkedin_url ?? null,
        email: r.email ?? null, instagram: r.instagram ?? null,
        south_america_relevant: r.south_america_relevant, notes: r.notes ?? null,
        state: "prospect", last_touched: null,
      }));
      const { error: insertError } = await supabase.from("prospects").insert(payload);
      if (insertError) { setError(insertError.message); setImporting(false); return; }
    }
    setResult({ added: toInsert.length, skippedDuplicate, skippedMissingName });
    setImporting(false);
  }

  const missingCount = rows?.filter((r) => r.missingName).length ?? 0;
  const dupSkipCount = rows?.filter((r) => r.duplicateOf && r.skipDuplicate).length ?? 0;
  const formattingIssueCount = rows?.filter((r) => r.formattingIssue).length ?? 0;
  const willImportCount = rows?.filter((r) => !r.missingName && !(r.duplicateOf && r.skipDuplicate)).length ?? 0;

  if (result) {
    return (
      <div className="my-3 panel p-4 max-w-lg">
        <div className="text-lg font-semibold mb-2">Import complete</div>
        <p className="text-sm">
          {result.added} added, {result.skippedDuplicate} skipped (duplicates), {result.skippedMissingName} skipped (missing name).
        </p>
        <a href="/?sort=newest" className="btn btn-primary inline-block mt-3">Back to Prospects</a>
      </div>
    );
  }

  return (
    <div className="my-3 grid gap-3 max-w-3xl">
      <div className="flex items-center gap-2 flex-wrap">
        <a href="/" className="btn btn-ghost text-sm">← Back to Prospects</a>
      </div>

      <div className="panel p-4">
        <div className="mono text-xs text-muted mb-2">import prospects from csv</div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
          Choose CSV file
        </button>
        {error && <p className="text-cold text-sm mt-2">{error}</p>}
      </div>

      {rows && (
        <div className="panel p-4 grid gap-3">
          <div className="text-sm">
            {rows.length} row{rows.length === 1 ? "" : "s"} found
            {missingCount > 0 && `, ${missingCount} missing a name will be skipped`}
            {dupSkipCount > 0 && `, ${dupSkipCount} possible duplicate${dupSkipCount === 1 ? "" : "s"} will be skipped`}
            {checking && " — checking for duplicates…"}
          </div>
          {formattingIssueCount > 0 && (
            <p className="text-sm text-warn">
              {formattingIssueCount} row{formattingIssueCount === 1 ? "" : "s"} had more columns than the header (often an
              unescaped comma in a field like notes) — some data on those rows may be cut off. Marked below; review before importing.
            </p>
          )}

          <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
            {rows.map((r, i) => (
              <div key={i} className={`panel p-3 ${r.missingName ? "border-cold" : ""}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-semibold ${r.missingName ? "text-cold" : ""}`}>
                    {r.name || "(missing name)"}
                  </span>
                  {r.missingName && <span className="chip text-cold border-cold">will be skipped</span>}
                  {r.formattingIssue && <span className="chip text-warn border-warn">check formatting</span>}
                  <span className="text-sm text-muted">{[r.title, r.company, r.region].filter(Boolean).join(" · ")}</span>
                </div>
                {r.notes && <div className={`text-sm mt-1 ${r.formattingIssue ? "text-warn" : "text-muted"}`}>{r.notes}</div>}
                {r.duplicateOf && (
                  <label className="flex items-center gap-2 text-sm text-warn mt-2">
                    <input type="checkbox" checked={r.skipDuplicate} onChange={() => toggleSkip(i)} />
                    possible duplicate — existing prospect: {r.duplicateOf.name} — skip
                  </label>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <button className="btn btn-primary" onClick={doImport} disabled={checking || importing || willImportCount === 0}>
              {importing ? "Importing…" : `Import ${willImportCount} prospect${willImportCount === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

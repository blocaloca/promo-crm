"use client";
import { useState } from "react";
import { getTemplate, type PromoLike } from "./types";

// long edge for rasterized JPG exports — matches the app's own upload cap
// (see lib/downscale.ts), so this is the highest resolution actually available
const MAX_EDGE = 2000;

function filenameFor(promo: PromoLike) {
  const base = (promo.name || "promo").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "promo"}.jpg`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButtons({ promo, imageUrl }: { promo: PromoLike; imageUrl?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function downloadJpg() {
    setBusy(true);
    setError("");
    try {
      const template = getTemplate(promo.template_key);
      if (template.key === "full_image" && imageUrl) {
        // the uploaded file itself is already the highest-resolution copy we have
        const res = await fetch(imageUrl);
        download(await res.blob(), filenameFor(promo));
        return;
      }

      const node = document.getElementById("promo-export-target");
      if (!node) throw new Error("Nothing to export");
      await document.fonts.ready;

      // AspectFrame renders the card at a fixed design width, then scales
      // it down via a CSS transform to fit narrow (e.g. mobile) screens.
      // html2canvas doesn't correctly capture elements nested inside a
      // scaled-down ancestor — text ends up overlapping instead of
      // stacked, and it gets dramatically worse the smaller the scale
      // factor is (barely visible at desktop widths, severe on a phone).
      // Neutralize the transform for the duration of the capture so
      // html2canvas always sees the card at its true, unscaled layout.
      const scaleWrapper = document.getElementById("promo-scale-wrapper");
      const previousTransform = scaleWrapper?.style.transform;
      if (scaleWrapper) scaleWrapper.style.transform = "none";

      // links are underlined on the live page (a normal clickability cue),
      // but that underline shouldn't show up in a flat JPG export — strip
      // it for the duration of the capture only
      const links = Array.from(node.querySelectorAll("a"));
      const previousDecorations = links.map((a) => a.style.textDecoration);
      links.forEach((a) => (a.style.textDecoration = "none"));

      const scale = MAX_EDGE / Math.max(node.offsetWidth, node.offsetHeight);
      const html2canvas = (await import("html2canvas")).default;
      let blob: Blob | null;
      try {
        const canvas = await html2canvas(node, {
          scale,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      } finally {
        if (scaleWrapper) scaleWrapper.style.transform = previousTransform ?? "";
        links.forEach((a, i) => (a.style.textDecoration = previousDecorations[i]));
      }
      if (!blob) throw new Error("Export failed");
      download(blob, filenameFor(promo));
    } catch {
      setError("Couldn't generate the JPG — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="print:hidden mt-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={downloadJpg}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
        >
          {busy ? "Exporting…" : "Download JPG"}
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50"
        >
          Print / Save as PDF
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-neutral-500">
        JPG downloads at actual aspect ratio, full resolution. For a clean PDF, uncheck "Headers and footers" under "More settings" in the print dialog.
      </p>
    </div>
  );
}

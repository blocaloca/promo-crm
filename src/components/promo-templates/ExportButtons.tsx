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
      // html-to-image rasterizes via an SVG <foreignObject>, which has
      // long-standing reliability problems on Safari/iOS — cross-origin
      // images especially can silently fail to embed. html2canvas paints
      // the DOM onto a canvas directly instead, which works consistently
      // across browsers including mobile Safari.
      //
      // Montserrat is a web font — if html2canvas captures before it's
      // fully loaded, it measures text with the fallback font but paints
      // with Montserrat once it arrives, so lines end up overlapping
      // instead of stacked. document.fonts.ready guarantees it's loaded.
      await document.fonts.ready;
      const scale = MAX_EDGE / Math.max(node.offsetWidth, node.offsetHeight);
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(node, {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
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

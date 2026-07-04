"use client";

// hidden when actually printing — it's just the trigger for the browser's own
// print dialog, where "Save as PDF" is a destination like any printer
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50"
    >
      Print / Save as PDF
    </button>
  );
}

"use client";

// hidden when actually printing — it's just the trigger for the browser's own
// print dialog, where "Save as PDF" is a destination like any printer
export default function PrintButton() {
  return (
    <div className="print:hidden mt-6">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50"
      >
        Print / Save as PDF
      </button>
      <p className="mt-2 text-xs text-neutral-500">
        For a clean file, uncheck "Headers and footers" under "More settings" in the print dialog.
      </p>
    </div>
  );
}

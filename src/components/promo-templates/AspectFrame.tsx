import type { ReactNode } from "react";

// maps the promo's aspect_ratio field to a real CSS aspect-ratio so the builder
// preview and the published card are never lying about their shape
const ASPECT_CSS: Record<string, string> = {
  "1.91:1": "1.91 / 1",
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "9:16": "9 / 16",
  letter: "8.5 / 11",
};
const DEFAULT_ASPECT = "1.91:1";

export default function AspectFrame({
  aspectRatio,
  children,
}: {
  aspectRatio?: string | null;
  children: ReactNode;
}) {
  const css = (aspectRatio && ASPECT_CSS[aspectRatio]) || ASPECT_CSS[DEFAULT_ASPECT];
  return (
    <div
      className="w-full mx-auto overflow-y-auto rounded-lg border border-edge bg-white text-neutral-900"
      style={{ aspectRatio: css }}
    >
      <div className="p-6">{children}</div>
    </div>
  );
}

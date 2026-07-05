// only the aspect ratio survives as a builder control — every other visual
// property (font, size, spacing) is fixed per template to match its design.

export interface PromoStyleFields {
  aspect_ratio?: string | null;
}

export const ASPECT_PRESETS = ["1.91:1", "1:1", "4:5", "9:16", "letter"];
const DEFAULT_ASPECT = "1.91:1";
const PADDING_CLASS = "p-6";

export function aspectRatioToCss(value?: string | null): string {
  if (value === "letter") return "8.5 / 11";
  const m = (value ?? "").match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (m) return `${m[1]} / ${m[2]}`;
  return aspectRatioToCss(DEFAULT_ASPECT);
}

export function getPromoStyle(promo: PromoStyleFields) {
  return { aspectCss: aspectRatioToCss(promo.aspect_ratio), paddingClass: PADDING_CLASS };
}

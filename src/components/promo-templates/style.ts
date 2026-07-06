// aspect ratio is locked per template (matching its mockup) — not a user
// control. Every other visual property (font, size, spacing) is likewise
// fixed per template.
import { getTemplate, type PromoLike } from "./types";

export type PromoStyleFields = Pick<PromoLike, "template_key">;

const PADDING_CLASS = "p-6";

export function aspectRatioToCss(value?: string | null): string {
  if (value === "letter") return "8.5 / 11";
  const m = (value ?? "").match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (m) return `${m[1]} / ${m[2]}`;
  return "1 / 1";
}

export function getPromoStyle(promo: PromoStyleFields) {
  const template = getTemplate(promo.template_key);
  return { aspectCss: aspectRatioToCss(template.defaultAspectRatio), paddingClass: PADDING_CLASS };
}

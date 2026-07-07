// aspect ratio is locked per template (matching its mockup) — not a user
// control. The one exception is full_image, whose shape comes from the
// uploaded artwork itself (see promo.aspect_ratio, set when the image is
// picked). Every other visual property (font, size, spacing) is fixed
// per template.
import { getTemplate, type PromoLike } from "./types";

export type PromoStyleFields = Pick<PromoLike, "template_key" | "aspect_ratio">;

const PADDING_CLASS = "p-6";

export function aspectRatioToCss(value?: string | null): string {
  if (value === "letter") return "8.5 / 11";
  const m = (value ?? "").match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (m) return `${m[1]} / ${m[2]}`;
  return "1 / 1";
}

// numeric W:H — used by the JPG exporter to size its output canvas
export function aspectRatioToWH(value?: string | null): { w: number; h: number } {
  if (value === "letter") return { w: 8.5, h: 11 };
  const m = (value ?? "").match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (m) return { w: parseFloat(m[1]), h: parseFloat(m[2]) };
  return { w: 1, h: 1 };
}

export function resolveAspectRatio(promo: PromoStyleFields): string | null | undefined {
  const template = getTemplate(promo.template_key);
  return template.defaultAspectRatio ?? promo.aspect_ratio;
}

export function getPromoStyle(promo: PromoStyleFields) {
  const template = getTemplate(promo.template_key);
  return {
    aspectCss: aspectRatioToCss(resolveAspectRatio(promo)),
    paddingClass: template.key === "full_image" ? "" : PADDING_CLASS,
  };
}

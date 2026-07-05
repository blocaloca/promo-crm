// per-promo card styling: font, size, line height, padding, aspect ratio.
// text position and image position are handled separately in AdaptiveTemplate
// (image_anchor / text_placement), since those are structural, not typographic.

export interface PromoStyleFields {
  font_family?: string | null;
  font_size?: string | null;
  padding?: string | null;
  line_height?: string | null;
  aspect_ratio?: string | null;
}

export const FONT_OPTIONS = [
  { value: "hanken", label: "Hanken Grotesk", css: "'Hanken Grotesk', sans-serif" },
  { value: "montserrat", label: "Montserrat", css: "'Montserrat', sans-serif" },
];
const DEFAULT_FONT = "hanken";

export const FONT_SIZE_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];
const DEFAULT_FONT_SIZE = "md";
const HEADLINE_SIZE_CLASS: Record<string, string> = { sm: "text-xl", md: "text-3xl", lg: "text-5xl" };
const BODY_SIZE_CLASS: Record<string, string> = { sm: "text-sm", md: "text-lg", lg: "text-xl" };

export const PADDING_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];
const DEFAULT_PADDING = "md";
const PADDING_CLASS: Record<string, string> = { sm: "p-3", md: "p-6", lg: "p-10" };

export const LINE_HEIGHT_OPTIONS = [
  { value: "tight", label: "Tight" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Relaxed" },
];
const DEFAULT_LINE_HEIGHT = "normal";
const LINE_HEIGHT_CLASS: Record<string, string> = { tight: "leading-[1.1]", normal: "leading-normal", relaxed: "leading-loose" };

export const ASPECT_PRESETS = ["1.91:1", "1:1", "4:5", "9:16", "letter"];
const DEFAULT_ASPECT = "1.91:1";

export function aspectRatioToCss(value?: string | null): string {
  if (value === "letter") return "8.5 / 11";
  const m = (value ?? "").match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (m) return `${m[1]} / ${m[2]}`;
  return aspectRatioToCss(DEFAULT_ASPECT);
}

export function getPromoStyle(promo: PromoStyleFields) {
  const font = FONT_OPTIONS.find((f) => f.value === promo.font_family) ?? FONT_OPTIONS.find((f) => f.value === DEFAULT_FONT)!;
  const fontSize = promo.font_size && BODY_SIZE_CLASS[promo.font_size] ? promo.font_size : DEFAULT_FONT_SIZE;
  const padding = promo.padding && PADDING_CLASS[promo.padding] ? promo.padding : DEFAULT_PADDING;
  const lineHeight = promo.line_height && LINE_HEIGHT_CLASS[promo.line_height] ? promo.line_height : DEFAULT_LINE_HEIGHT;

  return {
    fontFamily: font.css,
    headlineClass: HEADLINE_SIZE_CLASS[fontSize],
    bodyClass: BODY_SIZE_CLASS[fontSize],
    paddingClass: PADDING_CLASS[padding],
    lineHeightClass: LINE_HEIGHT_CLASS[lineHeight],
    aspectCss: aspectRatioToCss(promo.aspect_ratio),
  };
}

export type PromoTemplateKey = "adaptive";

export interface PromoTemplateEntry {
  key: PromoTemplateKey;
  label: string;
  minImages: number;
  maxImages: number;
}

// one adaptive template for now — structure left in place for a future second one
// (e.g. a multi-image gallery) without reshaping the registry/switch mechanism
export const PROMO_TEMPLATES: PromoTemplateEntry[] = [
  { key: "adaptive", label: "Adaptive", minImages: 0, maxImages: 1 },
];

export const DEFAULT_TEMPLATE_KEY: PromoTemplateKey = "adaptive";

export function getTemplate(key?: string | null): PromoTemplateEntry {
  return (
    PROMO_TEMPLATES.find((t) => t.key === key) ??
    PROMO_TEMPLATES.find((t) => t.key === DEFAULT_TEMPLATE_KEY)!
  );
}

export const TEXT_PLACEMENT_OPTIONS = [
  { value: "bottom", label: "Image top, text below" },
  { value: "right", label: "Image left, text right" },
  { value: "left", label: "Image right, text left" },
  { value: "top", label: "Text above, image below" },
];
export const DEFAULT_TEXT_PLACEMENT = "bottom";

// 3x3 anchor grid — where the (never-cropped) image sits within its zone.
// values double as valid CSS object-position keywords.
export const IMAGE_ANCHOR_OPTIONS = [
  { value: "left top", label: "Top left" },
  { value: "center top", label: "Top center" },
  { value: "right top", label: "Top right" },
  { value: "left center", label: "Middle left" },
  { value: "center center", label: "Center" },
  { value: "right center", label: "Middle right" },
  { value: "left bottom", label: "Bottom left" },
  { value: "center bottom", label: "Bottom center" },
  { value: "right bottom", label: "Bottom right" },
];
export const DEFAULT_IMAGE_ANCHOR = "center center";

// fields every layout needs — a subset shared by the full Promo row and the builder's draft
export interface PromoLike {
  name?: string | null;
  template_key?: string | null;
  headline?: string | null;
  body_copy?: string | null;
  link_url_1?: string | null;
  link_url_2?: string | null;
  contact_phone?: string | null;
  aspect_ratio?: string | null;
  font_family?: string | null;
  font_size?: string | null;
  padding?: string | null;
  line_height?: string | null;
  text_placement?: string | null;
  image_anchor?: string | null;
  brand_title?: string | null;
  logo_asset_id?: string | null;
}

export interface LayoutProps {
  promo: PromoLike;
  imageUrls: string[];
  logoUrl?: string | null;
}

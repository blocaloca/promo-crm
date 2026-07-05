export type PromoTemplateKey =
  | "cover_centered"
  | "split_centered"
  | "cover_footer_bar"
  | "split_footer_bar"
  | "fullbleed_footer_bar";

export interface PromoTemplateEntry {
  key: PromoTemplateKey;
  label: string;
  description: string;
  minImages: number;
  maxImages: number;
  defaultAspectRatio: string;
}

// fixed, hand-designed templates — no positioning knobs. Each one is its own
// component matching a specific mockup; pick a template, fill in content.
export const PROMO_TEMPLATES: PromoTemplateEntry[] = [
  {
    key: "cover_centered",
    label: "Cover Centered",
    description: "Image on top, brand + contact centered below",
    minImages: 1,
    maxImages: 1,
    defaultAspectRatio: "4:5",
  },
  {
    key: "split_centered",
    label: "Split Centered",
    description: "Image on the left, brand + contact centered on the right",
    minImages: 1,
    maxImages: 1,
    defaultAspectRatio: "4:3",
  },
  {
    key: "cover_footer_bar",
    label: "Cover Footer Bar",
    description: "Image on top, thin footer bar: brand left, contact right",
    minImages: 1,
    maxImages: 1,
    defaultAspectRatio: "4:3",
  },
  {
    key: "split_footer_bar",
    label: "Split Footer Bar",
    description: "Image on the left, full-width footer bar at the bottom",
    minImages: 1,
    maxImages: 1,
    defaultAspectRatio: "5:4",
  },
  {
    key: "fullbleed_footer_bar",
    label: "Full-Bleed Footer Bar",
    description: "Image fills the card, thin footer bar at the very bottom",
    minImages: 1,
    maxImages: 1,
    defaultAspectRatio: "4:5",
  },
];

export const DEFAULT_TEMPLATE_KEY: PromoTemplateKey = "cover_centered";

export function getTemplate(key?: string | null): PromoTemplateEntry {
  return (
    PROMO_TEMPLATES.find((t) => t.key === key) ??
    PROMO_TEMPLATES.find((t) => t.key === DEFAULT_TEMPLATE_KEY)!
  );
}

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
  brand_title?: string | null;
  logo_asset_id?: string | null;
}

export interface LayoutProps {
  promo: PromoLike;
  imageUrls: string[];
  logoUrl?: string | null;
}

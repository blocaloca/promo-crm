export type PromoTemplateKey = "hero" | "split" | "gallery";

export interface PromoTemplateEntry {
  key: PromoTemplateKey;
  label: string;
  minImages: number;
  maxImages: number;
}

// image capacity per layout — drives the builder's asset picker limits
export const PROMO_TEMPLATES: PromoTemplateEntry[] = [
  { key: "hero", label: "Hero", minImages: 1, maxImages: 1 },
  { key: "split", label: "Split", minImages: 1, maxImages: 1 },
  { key: "gallery", label: "Gallery", minImages: 2, maxImages: 6 },
];

export const DEFAULT_TEMPLATE_KEY: PromoTemplateKey = "hero";

export function getTemplate(key?: string | null): PromoTemplateEntry {
  return (
    PROMO_TEMPLATES.find((t) => t.key === key) ??
    PROMO_TEMPLATES.find((t) => t.key === DEFAULT_TEMPLATE_KEY)!
  );
}

// fields every layout needs — a subset shared by the full Promo row and the builder's draft
export interface PromoLike {
  template_key?: string | null;
  headline?: string | null;
  body_copy?: string | null;
  link_url?: string | null;
  aspect_ratio?: string | null;
  font_family?: string | null;
  font_size?: string | null;
  image_size?: string | null;
  justify_x?: string | null;
  justify_y?: string | null;
  padding?: string | null;
  line_height?: string | null;
}

export interface LayoutProps {
  promo: PromoLike;
  imageUrls: string[];
}

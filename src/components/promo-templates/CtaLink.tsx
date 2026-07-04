import type { PromoLike } from "./types";

// shows only what the user typed as the CTA label — never the raw link_url
export default function CtaLink({ promo }: { promo: Pick<PromoLike, "link_url" | "cta_text"> }) {
  if (!promo.cta_text) return null;
  if (!promo.link_url) return <span className="inline-block underline">{promo.cta_text}</span>;
  return (
    <a href={promo.link_url} className="inline-block underline">
      {promo.cta_text}
    </a>
  );
}

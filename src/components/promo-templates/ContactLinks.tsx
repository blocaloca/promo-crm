import type { PromoLike } from "./types";
import { getPromoStyle } from "./style";

// one phone number + up to two links, shown exactly as typed — the href gets
// a scheme prepended behind the scenes so a bare "davidcasteel.com" actually
// links out instead of resolving as a path relative to the promo page
function normalizeUrl(v: string) {
  return /^https?:\/\//i.test(v) || /^mailto:/i.test(v) ? v : `https://${v}`;
}
function normalizePhoneHref(v: string) {
  return `tel:${v.replace(/[^\d+]/g, "")}`;
}

export default function ContactLinks({ promo }: { promo: PromoLike }) {
  const { rowJustifyClass } = getPromoStyle(promo);
  const items = [
    promo.contact_phone && { href: normalizePhoneHref(promo.contact_phone), label: promo.contact_phone, external: false },
    promo.link_url_1 && { href: normalizeUrl(promo.link_url_1), label: promo.link_url_1, external: true },
    promo.link_url_2 && { href: normalizeUrl(promo.link_url_2), label: promo.link_url_2, external: true },
  ].filter(Boolean) as { href: string; label: string; external: boolean }[];

  if (!items.length) return null;

  return (
    <div className={`flex flex-wrap gap-4 ${rowJustifyClass}`}>
      {items.map((it, i) => (
        <a
          key={i}
          href={it.href}
          className="inline-block underline"
          target={it.external ? "_blank" : undefined}
          rel={it.external ? "noopener noreferrer" : undefined}
        >
          {it.label}
        </a>
      ))}
    </div>
  );
}

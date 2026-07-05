import type { PromoLike } from "./types";

// one phone number + up to two links, shown exactly as typed — the href gets
// a scheme prepended behind the scenes so a bare "davidcasteel.com" actually
// links out instead of resolving as a path relative to the promo page
function normalizeUrl(v: string) {
  return /^https?:\/\//i.test(v) || /^mailto:/i.test(v) ? v : `https://${v}`;
}
function normalizePhoneHref(v: string) {
  return `tel:${v.replace(/[^\d+]/g, "")}`;
}

const JUSTIFY_CLASS: Record<string, string> = { left: "justify-start", center: "justify-center", right: "justify-end" };
const ITEMS_CLASS: Record<string, string> = { left: "items-start", center: "items-center", right: "items-end" };

type ContactFields = Pick<PromoLike, "contact_phone" | "link_url_1" | "link_url_2">;

// alignment/stacking is decided by the template that renders this, not by a
// per-promo control — each template hardcodes what its mockup shows
export default function ContactLinks({
  promo,
  align = "left",
  stack = false,
}: {
  promo: ContactFields;
  align?: "left" | "center" | "right";
  stack?: boolean;
}) {
  const items = [
    promo.contact_phone && { href: normalizePhoneHref(promo.contact_phone), label: promo.contact_phone, external: false },
    promo.link_url_1 && { href: normalizeUrl(promo.link_url_1), label: promo.link_url_1, external: true },
    promo.link_url_2 && { href: normalizeUrl(promo.link_url_2), label: promo.link_url_2, external: true },
  ].filter(Boolean) as { href: string; label: string; external: boolean }[];

  if (!items.length) return null;

  const layoutClass = stack ? `flex-col ${ITEMS_CLASS[align]}` : `flex-wrap ${JUSTIFY_CLASS[align]}`;

  return (
    <div className={`flex gap-2 ${layoutClass}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {items.map((it, i) => (
        <a
          key={i}
          href={it.href}
          className="inline-block underline text-sm"
          target={it.external ? "_blank" : undefined}
          rel={it.external ? "noopener noreferrer" : undefined}
        >
          {it.label}
        </a>
      ))}
    </div>
  );
}

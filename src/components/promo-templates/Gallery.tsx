import type { LayoutProps } from "./types";
import { getPromoStyle } from "./style";

// headline, multi-image grid, body/CTA below — restyle freely, this is a placeholder pass
export default function Gallery({ promo, imageUrls }: LayoutProps) {
  const s = getPromoStyle(promo);
  return (
    <div className={`grid gap-6 w-full ${s.textAlignClass}`}>
      {promo.headline && (
        <h1 className={`${s.headlineClass} font-semibold tracking-tight`} style={{ fontFamily: s.fontFamily }}>
          {promo.headline}
        </h1>
      )}
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {imageUrls.map((u, i) => (
            <img
              key={i}
              src={u}
              alt=""
              className="w-full aspect-square rounded-lg object-cover"
              style={{ objectPosition: s.objectPosition }}
            />
          ))}
        </div>
      )}
      {promo.body_copy && (
        <p className={`${s.bodyClass} ${s.lineHeightClass} whitespace-pre-wrap`} style={{ fontFamily: s.fontFamily }}>
          {promo.body_copy}
        </p>
      )}
      {promo.link_url && (
        <a href={promo.link_url} className="inline-block underline">
          {promo.link_url}
        </a>
      )}
    </div>
  );
}

import type { LayoutProps } from "./types";
import { getPromoStyle } from "./style";

// single hero image, headline/body/CTA stacked below — restyle freely, this is a placeholder pass
export default function Hero({ promo, imageUrls }: LayoutProps) {
  const s = getPromoStyle(promo);
  return (
    <div className="h-full w-full flex flex-col gap-4">
      {imageUrls[0] && (
        <img
          src={imageUrls[0]}
          alt=""
          className={`w-full shrink-0 rounded-lg object-cover ${s.imageHeightClass}`}
          style={{ objectPosition: s.objectPosition }}
        />
      )}
      <div className={`flex-1 flex flex-col gap-4 min-h-0 ${s.flexJustifyClass} ${s.textAlignClass}`}>
        {promo.headline && (
          <h1 className={`${s.headlineClass} font-semibold tracking-tight`} style={{ fontFamily: s.fontFamily }}>
            {promo.headline}
          </h1>
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
    </div>
  );
}

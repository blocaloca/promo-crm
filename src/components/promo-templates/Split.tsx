import type { LayoutProps } from "./types";
import { getPromoStyle } from "./style";
import CtaLink from "./CtaLink";

// image on one side, copy on the other — restyle freely, this is a placeholder pass
export default function Split({ promo, imageUrls }: LayoutProps) {
  const s = getPromoStyle(promo);
  return (
    <div className="grid sm:grid-cols-2 gap-6 w-full h-full">
      {imageUrls[0] && (
        <img
          src={imageUrls[0]}
          alt=""
          className="w-full h-full rounded-lg object-cover"
          style={{ objectPosition: s.objectPosition }}
        />
      )}
      <div className={`flex flex-col gap-4 min-h-0 ${s.flexJustifyClass} ${s.textAlignClass}`}>
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
        <CtaLink promo={promo} />
      </div>
    </div>
  );
}

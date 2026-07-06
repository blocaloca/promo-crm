import type { LayoutProps } from "./types";
import BrandMark from "./BrandMark";
import ContactLinks from "./ContactLinks";

// image on top, brand mark + contact centered below with a big gap between them
export default function CoverCentered({ promo, imageUrls, logoUrl }: LayoutProps) {
  const image = imageUrls[0];
  return (
    <div className="h-full w-full flex flex-col" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {image && (
        <div className="flex-[65] min-h-0 w-full">
          <img src={image} alt="" className="w-full h-full object-contain" />
        </div>
      )}
      <div className="flex-[35] min-h-0 flex flex-col items-center justify-center gap-10 text-center px-4">
        <BrandMark logoUrl={logoUrl} brandTitle={promo.brand_title} />
        {(promo.headline || promo.body_copy) && (
          <div>
            {promo.headline && <h1 className="text-2xl font-semibold tracking-tight">{promo.headline}</h1>}
            {promo.body_copy && <p className="text-sm whitespace-pre-wrap mt-1">{promo.body_copy}</p>}
          </div>
        )}
        <ContactLinks promo={promo} align="center" />
      </div>
    </div>
  );
}

import type { LayoutProps } from "./types";
import BrandMark from "./BrandMark";
import ContactLinks from "./ContactLinks";

// image on the left; right column is right-aligned with the brand mark
// vertically centered in the space above the contact block, which is
// pinned to the bottom — the two aren't one centered chunk, they're
// independently positioned
export default function SplitCentered({ promo, imageUrls, logoUrl }: LayoutProps) {
  const image = imageUrls[0];
  return (
    <div className="h-full w-full flex gap-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {image && (
        <div className="flex-[64] min-w-0 h-full">
          <img src={image} alt="" className="w-full h-full object-contain" />
        </div>
      )}
      <div className="flex-[36] min-w-0 h-full flex flex-col items-end text-right">
        <div className="flex-1 min-h-0 w-full flex flex-col items-end justify-center gap-3">
          <BrandMark logoUrl={logoUrl} brandTitle={promo.brand_title} />
          {(promo.headline || promo.body_copy) && (
            <div>
              {promo.headline && <h1 className="text-xl font-semibold tracking-tight">{promo.headline}</h1>}
              {promo.body_copy && <p className="text-sm whitespace-pre-wrap mt-1">{promo.body_copy}</p>}
            </div>
          )}
        </div>
        <ContactLinks promo={promo} align="right" stack />
      </div>
    </div>
  );
}

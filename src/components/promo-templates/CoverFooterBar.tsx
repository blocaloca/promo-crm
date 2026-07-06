import type { LayoutProps } from "./types";
import BrandMark from "./BrandMark";
import ContactLinks from "./ContactLinks";

// image on top, footer bar below: brand top-left of the bar, contact
// top-right (the two align to the same baseline, not the bar's bottom edge)
export default function CoverFooterBar({ promo, imageUrls, logoUrl }: LayoutProps) {
  const image = imageUrls[0];
  return (
    <div className="h-full w-full flex flex-col" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {image && (
        <div className="flex-[82] min-h-0 w-full">
          <img src={image} alt="" className="w-full h-full object-contain" />
        </div>
      )}
      <div className="flex-[18] min-h-0 flex items-start justify-between gap-4 pt-4">
        <BrandMark logoUrl={logoUrl} brandTitle={promo.brand_title} />
        <ContactLinks promo={promo} align="right" stack />
      </div>
    </div>
  );
}

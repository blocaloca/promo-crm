import type { LayoutProps } from "./types";
import BrandMark from "./BrandMark";
import ContactLinks from "./ContactLinks";

// image on top, thin footer bar below: brand bottom-left, contact bottom-right
export default function CoverFooterBar({ promo, imageUrls, logoUrl }: LayoutProps) {
  const image = imageUrls[0];
  return (
    <div className="h-full w-full flex flex-col" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {image && (
        <div className="flex-[9] min-h-0 w-full">
          <img src={image} alt="" className="w-full h-full object-contain" />
        </div>
      )}
      <div className="flex-1 min-h-0 flex items-end justify-between gap-4">
        <BrandMark logoUrl={logoUrl} brandTitle={promo.brand_title} />
        <ContactLinks promo={promo} align="right" stack />
      </div>
    </div>
  );
}

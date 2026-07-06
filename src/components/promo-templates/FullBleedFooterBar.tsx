import type { LayoutProps } from "./types";
import BrandMark from "./BrandMark";
import ContactLinks from "./ContactLinks";

// image fills nearly the whole card, footer bar squeezed into a thin strip
// at the very bottom: brand top-left of the bar, contact top-right
export default function FullBleedFooterBar({ promo, imageUrls, logoUrl }: LayoutProps) {
  const image = imageUrls[0];
  return (
    <div className="h-full w-full flex flex-col" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {image && (
        <div className="flex-[87] min-h-0 w-full">
          <img src={image} alt="" className="w-full h-full object-contain" />
        </div>
      )}
      <div className="flex-[13] min-h-0 flex items-start justify-between gap-4 pt-4">
        <BrandMark logoUrl={logoUrl} brandTitle={promo.brand_title} />
        <ContactLinks promo={promo} align="right" stack />
      </div>
    </div>
  );
}

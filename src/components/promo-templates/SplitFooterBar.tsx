import type { LayoutProps } from "./types";
import BrandMark from "./BrandMark";
import ContactLinks from "./ContactLinks";

// image on the left (nearly full height), brand mark sits directly under it;
// the right side is empty until a full-width footer bar anchors contact info
// to the bottom-right, level with the brand mark
export default function SplitFooterBar({ promo, imageUrls, logoUrl }: LayoutProps) {
  const image = imageUrls[0];
  return (
    <div className="h-full w-full flex gap-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <div className="flex-1 min-w-0 h-full flex flex-col">
        {image && (
          <div className="flex-[9] min-h-0 w-full">
            <img src={image} alt="" className="w-full h-full object-contain" />
          </div>
        )}
        <div className="flex-1 min-h-0 flex items-end">
          <BrandMark logoUrl={logoUrl} brandTitle={promo.brand_title} />
        </div>
      </div>
      <div className="flex-1 min-w-0 h-full flex flex-col justify-end items-end">
        <ContactLinks promo={promo} align="right" stack />
      </div>
    </div>
  );
}

import type { LayoutProps } from "./types";
import { DEFAULT_TEXT_PLACEMENT, DEFAULT_IMAGE_ANCHOR, TEXT_PLACEMENT_OPTIONS, IMAGE_ANCHOR_OPTIONS } from "./types";
import { getPromoStyle } from "./style";
import ContactLinks from "./ContactLinks";

// image top, text below | image left, text right | image right, text left | text above, image below
const CONTAINER_FLEX: Record<string, string> = {
  bottom: "flex-col",
  top: "flex-col-reverse",
  right: "flex-row",
  left: "flex-row-reverse",
};

// restyle freely — this is the plumbing pass: no-crop image, 3x3 anchor,
// text-placement switch, logo-wins-else-title brand mark, render-only-what's-set
export default function AdaptiveTemplate({ promo, imageUrls, logoUrl }: LayoutProps) {
  const s = getPromoStyle(promo);
  const placement = TEXT_PLACEMENT_OPTIONS.some((o) => o.value === promo.text_placement) ? promo.text_placement! : DEFAULT_TEXT_PLACEMENT;
  const anchor = IMAGE_ANCHOR_OPTIONS.some((o) => o.value === promo.image_anchor) ? promo.image_anchor! : DEFAULT_IMAGE_ANCHOR;
  const isRow = placement === "left" || placement === "right";
  const image = imageUrls[0];

  return (
    <div className={`h-full w-full flex ${CONTAINER_FLEX[placement]} gap-6`}>
      {image && (
        <div className={isRow ? "flex-1 min-w-0 h-full" : "flex-[3] min-h-0 w-full"}>
          <img src={image} alt="" className="w-full h-full object-contain" style={{ objectPosition: anchor }} />
        </div>
      )}
      <div
        className={`flex flex-col gap-3 min-h-0 min-w-0 ${image ? (isRow ? "flex-1" : "flex-[2]") : "flex-1"} ${isRow ? "justify-center" : ""}`}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-10 w-auto object-contain" />
        ) : promo.brand_title ? (
          <div className="text-sm font-semibold tracking-wide uppercase" style={{ fontFamily: s.fontFamily }}>
            {promo.brand_title}
          </div>
        ) : null}
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
        <ContactLinks promo={promo} />
      </div>
    </div>
  );
}

import CoverCentered from "./CoverCentered";
import SplitCentered from "./SplitCentered";
import CoverFooterBar from "./CoverFooterBar";
import SplitFooterBar from "./SplitFooterBar";
import FullBleedFooterBar from "./FullBleedFooterBar";
import FullImage from "./FullImage";
import type { LayoutProps, PromoTemplateKey } from "./types";
import { getTemplate } from "./types";

const LAYOUTS: Record<PromoTemplateKey, (props: LayoutProps) => JSX.Element | null> = {
  cover_centered: CoverCentered,
  split_centered: SplitCentered,
  cover_footer_bar: CoverFooterBar,
  split_footer_bar: SplitFooterBar,
  fullbleed_footer_bar: FullBleedFooterBar,
  full_image: FullImage,
};

// single switch point — builder preview and /p/[token] both render through this,
// so they can't drift apart
export default function PromoRenderer({ promo, imageUrls, logoUrl }: LayoutProps) {
  const template = getTemplate(promo.template_key);
  const Layout = LAYOUTS[template.key];
  return <Layout promo={promo} imageUrls={imageUrls} logoUrl={logoUrl} />;
}

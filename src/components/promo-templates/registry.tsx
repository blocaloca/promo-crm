import AdaptiveTemplate from "./AdaptiveTemplate";
import type { LayoutProps, PromoTemplateKey } from "./types";
import { getTemplate } from "./types";

const LAYOUTS: Record<PromoTemplateKey, (props: LayoutProps) => JSX.Element> = {
  adaptive: AdaptiveTemplate,
};

// single switch point — builder preview and /p/[token] both render through this,
// so they can't drift apart
export default function PromoRenderer({ promo, imageUrls, logoUrl }: LayoutProps) {
  const template = getTemplate(promo.template_key);
  const Layout = LAYOUTS[template.key];
  return <Layout promo={promo} imageUrls={imageUrls} logoUrl={logoUrl} />;
}

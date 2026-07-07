import type { ReactNode } from "react";
import { getPromoStyle, type PromoStyleFields } from "./style";

// wraps template content in a box shaped by the promo's aspect_ratio, so the
// builder preview and the published card are never lying about their shape
export default function AspectFrame({
  promo,
  children,
}: {
  promo: PromoStyleFields;
  children: ReactNode;
}) {
  const { aspectCss, paddingClass } = getPromoStyle(promo);
  return (
    <div
      className="w-full mx-auto overflow-y-auto rounded-lg border border-edge bg-white text-neutral-900 print:overflow-visible print:border-none print:rounded-none"
      style={{ aspectRatio: aspectCss }}
    >
      <div id="promo-export-target" className={`h-full flex flex-col ${paddingClass}`}>{children}</div>
    </div>
  );
}

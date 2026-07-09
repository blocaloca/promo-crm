"use client";
import { useLayoutEffect, useEffect, useRef, useState, type ReactNode } from "react";
import { getPromoStyle, type PromoStyleFields } from "./style";

// the card is always laid out at this one canonical width, then uniformly
// scaled to fit whatever container it's placed in — so a phone shows a
// scaled-down photograph of the exact same layout, never a different reflow
// (fixed text sizes would otherwise look wildly disproportionate on a much
// narrower mobile container)
const DESIGN_WIDTH = 700;

// avoids a "useLayoutEffect does nothing on the server" warning during SSR
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function AspectFrame({
  promo,
  children,
}: {
  promo: PromoStyleFields;
  children: ReactNode;
}) {
  const { aspectCss, paddingClass } = getPromoStyle(promo);
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useIsoLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / DESIGN_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="w-full mx-auto relative overflow-hidden rounded-lg border border-edge bg-white text-neutral-900 print:rounded-none"
      style={{ aspectRatio: aspectCss }}
    >
      <div
        id="promo-scale-wrapper"
        className="absolute top-0 left-0 bg-white"
        style={{ width: DESIGN_WIDTH, aspectRatio: aspectCss, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <div id="promo-export-target" className={`h-full flex flex-col ${paddingClass}`}>{children}</div>
      </div>
    </div>
  );
}

import type { LayoutProps } from "./types";

// single hero image, headline/body/CTA stacked below — restyle freely, this is a placeholder pass
export default function Hero({ promo, imageUrls }: LayoutProps) {
  return (
    <div className="grid gap-6">
      {imageUrls[0] && <img src={imageUrls[0]} alt="" className="w-full rounded-lg object-cover" />}
      {promo.headline && (
        <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
          {promo.headline}
        </h1>
      )}
      {promo.body_copy && <p className="text-lg leading-relaxed whitespace-pre-wrap">{promo.body_copy}</p>}
      {promo.link_url && (
        <a href={promo.link_url} className="inline-block underline">
          {promo.link_url}
        </a>
      )}
    </div>
  );
}

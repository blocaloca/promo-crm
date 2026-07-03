import type { LayoutProps } from "./types";

// headline, multi-image grid, body/CTA below — restyle freely, this is a placeholder pass
export default function Gallery({ promo, imageUrls }: LayoutProps) {
  return (
    <div className="grid gap-6">
      {promo.headline && (
        <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
          {promo.headline}
        </h1>
      )}
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {imageUrls.map((u, i) => (
            <img key={i} src={u} alt="" className="w-full aspect-square rounded-lg object-cover" />
          ))}
        </div>
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

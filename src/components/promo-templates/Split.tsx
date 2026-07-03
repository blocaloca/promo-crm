import type { LayoutProps } from "./types";

// image on one side, copy on the other — restyle freely, this is a placeholder pass
export default function Split({ promo, imageUrls }: LayoutProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-6 items-center">
      {imageUrls[0] && <img src={imageUrls[0]} alt="" className="w-full h-full rounded-lg object-cover" />}
      <div className="grid gap-4">
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
    </div>
  );
}

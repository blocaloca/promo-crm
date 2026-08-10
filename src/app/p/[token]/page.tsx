import { getPublishedPromoByToken, incrementPromoView } from "@/actions/promos";
import { PromoRenderer, AspectFrame, ExportButtons } from "@/components/promo-templates";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const r = await getPublishedPromoByToken(params.token);
  if (!r) return { title: "Promo" };
  const { promo, urls } = r;
  return {
    title: promo.og_title || promo.name,
    description: promo.og_description || promo.headline || "",
    openGraph: {
      title: promo.og_title || promo.name,
      description: promo.og_description || promo.headline || "",
      images: urls[0] ? [{ url: urls[0] }] : [],
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function PromoPage({ params }: { params: { token: string } }) {
  const r = await getPublishedPromoByToken(params.token);
  if (!r) return <main className="min-h-screen grid place-items-center text-muted">Not found.</main>;
  const { promo, urls, logoUrl } = r;

  // fire-and-forget view count
  await incrementPromoView(promo.id);

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-3xl mx-auto px-6 py-12 print:p-0 print:max-w-none print:h-screen print:flex print:flex-col print:justify-center print:items-center">
        <AspectFrame promo={promo}>
          <PromoRenderer promo={promo} imageUrls={urls} logoUrl={logoUrl ?? undefined} />
        </AspectFrame>
        <div className="print:hidden">
          <ExportButtons promo={promo} imageUrl={urls[0]} />
          <a href="/promos" className="block mt-4 text-sm text-neutral-500 underline">
            ← Back to Promo CRM
          </a>
        </div>
      </div>
    </main>
  );
}

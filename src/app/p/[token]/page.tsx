import { createClient } from "@/lib/supabase-server";
import { PromoRenderer, AspectFrame } from "@/components/promo-templates";
import type { Metadata } from "next";

const BUCKET = "promo-assets";

async function getPromo(token: string) {
  const supabase = createClient();
  const { data: promo } = await supabase.from("promos").select("*").eq("public_token", token).eq("status", "published").single();
  if (!promo) return null;
  const { data: pa } = await supabase.from("promo_assets").select("asset_id, slot").eq("promo_id", promo.id).order("slot");
  const ids = (pa ?? []).map((r) => r.asset_id);
  let urls: string[] = [];
  if (ids.length) {
    const { data: assets } = await supabase.from("assets").select("id, storage_path").in("id", ids);
    for (const r of pa ?? []) {
      const a = assets?.find((x) => x.id === r.asset_id);
      if (a) { const { data: s } = await supabase.storage.from(BUCKET).createSignedUrl(a.storage_path, 3600); if (s) urls.push(s.signedUrl); }
    }
  }
  return { promo, urls };
}

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const r = await getPromo(params.token);
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
  const r = await getPromo(params.token);
  if (!r) return <main className="min-h-screen grid place-items-center text-muted">Not found.</main>;
  const { promo, urls } = r;

  // fire-and-forget view count
  const supabase = createClient();
  await supabase.from("promos").update({ view_count: (promo.view_count ?? 0) + 1 }).eq("id", promo.id);

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <AspectFrame promo={promo}>
          <PromoRenderer promo={promo} imageUrls={urls} />
        </AspectFrame>
      </div>
    </main>
  );
}

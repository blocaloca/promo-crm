import type { LayoutProps } from "./types";

// finished artwork, uploaded whole — no logo/contact/headline compositing,
// shown edge-to-edge exactly as exported
export default function FullImage({ imageUrls }: LayoutProps) {
  const image = imageUrls[0];
  if (!image) return null;
  return <img src={image} alt="" className="w-full h-full object-contain" />;
}

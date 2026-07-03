// Client-side downscale: long edge -> maxEdge, JPEG quality ~0.8.
// Raw full-res files never leave the phone — key for LTE / in-the-Uber uploads.
export async function downscale(file: File, maxEdge = 2000, quality = 0.8): Promise<{ blob: Blob; width: number; height: number; thumb: Blob }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);

  const render = (tw: number, th: number, q: number) => {
    const c = document.createElement("canvas"); c.width = tw; c.height = th;
    c.getContext("2d")!.drawImage(bitmap, 0, 0, tw, th);
    return new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/jpeg", q));
  };

  const blob = await render(w, h, quality);
  const tScale = Math.min(1, 400 / Math.max(w, h));
  const thumb = await render(Math.round(w * tScale), Math.round(h * tScale), 0.7);
  return { blob, width: w, height: h, thumb };
}
export function orientationOf(w: number, h: number) {
  return w === h ? "square" : w > h ? "landscape" : "portrait";
}

// logo image and title text render together, side by side — an uploaded
// logo doesn't replace the title, the two sit next to each other exactly
// like "[logo graphic] by David Casteel"
export default function BrandMark({
  logoUrl,
  brandTitle,
  className = "",
}: {
  logoUrl?: string | null;
  brandTitle?: string | null;
  className?: string;
}) {
  if (!logoUrl && !brandTitle) return null;
  return (
    <div className={`flex items-center ${className}`}>
      {logoUrl && <img src={logoUrl} alt="" className="h-10 w-auto object-contain mr-3" />}
      {brandTitle && (
        <span className="text-sm font-medium" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {brandTitle}
        </span>
      )}
    </div>
  );
}

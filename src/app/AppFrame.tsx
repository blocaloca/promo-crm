"use client";
import Nav from "@/components/Nav";
import { usePathname } from "next/navigation";

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const bare = path.startsWith("/login") || path.startsWith("/p/");
  if (bare) return <>{children}</>;
  return (
    <div className="min-h-screen">
      <Nav />
      <div className="px-3 md:px-4 pb-24 max-w-6xl mx-auto">{children}</div>
    </div>
  );
}

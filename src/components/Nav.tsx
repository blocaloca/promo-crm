"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/auth";

const links = [
  { href: "/promos", label: "Promos" },
  { href: "/media", label: "Media" },
  { href: "/messages", label: "Messages" },
  { href: "/", label: "Prospects" },
  { href: "/lists", label: "Lists" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="panel m-3 md:m-4 px-3 py-2 flex items-center gap-1 overflow-x-auto sticky top-2 z-20">
      <span className="mono text-xs text-muted pr-2 hidden sm:inline">promo crm</span>
      {links.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href}
            className={`btn text-sm ${active ? "btn-primary" : "btn-ghost"}`}>{l.label}</Link>
        );
      })}
      <button className="btn btn-ghost text-sm ml-auto" onClick={() => logout()}>Sign out</button>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl px-3 py-1.5 font-medium transition",
        active ? "bg-brand-50 text-brand-900" : "text-slate-600 hover:bg-slate-50 hover:text-brand-900",
      )}
    >
      {children}
    </Link>
  );
}

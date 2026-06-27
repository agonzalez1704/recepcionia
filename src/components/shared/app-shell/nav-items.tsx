"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  CalendarDays,
  Users,
  UserSearch,
  Settings,
  Plug,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon };
type Grupo = { titulo: string; items: Item[] };

const GRUPOS: Grupo[] = [
  {
    titulo: "Operación",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/mensajes", label: "Mensajes", icon: MessageCircle },
      { href: "/leads", label: "Leads", icon: UserSearch },
      { href: "/turnos", label: "Turnos", icon: CalendarDays },
    ],
  },
  {
    titulo: "Clínica",
    items: [
      { href: "/equipo", label: "Equipo", icon: Users },
      { href: "/configuracion", label: "Configuración", icon: Settings },
      { href: "/integraciones", label: "Integraciones", icon: Plug },
    ],
  },
  {
    titulo: "Cuenta",
    items: [{ href: "/facturacion", label: "Facturación", icon: CreditCard }],
  },
];

function useActivo() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(href + "/");
}

export function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const esActivo = useActivo();
  return (
    <nav className="flex flex-1 flex-col gap-6 px-3">
      {GRUPOS.map((g) => (
        <div key={g.titulo}>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            {g.titulo}
          </p>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const activo = esActivo(it.href);
              const Icon = it.icon;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                      activo
                        ? "bg-white/12 text-white"
                        : "text-white/65 hover:bg-white/8 hover:text-white",
                    )}
                  >
                    {activo && (
                      <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-cielo-400" />
                    )}
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition",
                        activo ? "text-cielo-400" : "text-white/55 group-hover:text-white",
                      )}
                    />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  MessageCircle,
  CalendarDays,
  Users,
  Settings,
  Plug,
  CreditCard,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon };
type Grupo = { titulo: string; items: Item[] };

const GRUPOS: Grupo[] = [
  {
    titulo: "Operación",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/mensajes", label: "Mensajes", icon: MessageCircle },
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

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
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

function SidebarInterno({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-brand-900 to-brand-950">
      <div className="flex items-center gap-2 px-5 py-5">
        <Logo variant="word" inverted />
      </div>
      <NavItems onNavigate={onNavigate} />
      <div className="mt-auto border-t border-white/10 p-3">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2">
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "flex",
                organizationSwitcherTrigger:
                  "text-white/90 hover:bg-white/10 rounded-lg px-1.5 py-1 gap-1.5",
                organizationPreviewMainIdentifier: "text-white text-sm",
                organizationSwitcherTriggerIcon: "text-white/60",
              },
            }}
          />
          <UserButton />
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  orgActiva,
  children,
}: {
  orgActiva: boolean;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  // El onboarding crea la org, así que no debe quedar tapado por el gate.
  const mostrarContenido = orgActiva || pathname.startsWith("/onboarding");

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <SidebarInterno />
        </div>
      </aside>

      {/* Drawer mobile */}
      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-brand-950/60 backdrop-blur-sm"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            <button
              onClick={() => setAbierto(false)}
              className="absolute right-3 top-4 z-10 text-white/70 hover:text-white"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarInterno onNavigate={() => setAbierto(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setAbierto(true)}
            className="rounded-lg p-1.5 text-brand-900 hover:bg-slate-100"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo variant="word" />
          <UserButton />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">
            {mostrarContenido ? (
              children
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                Necesitás{" "}
                <Link href="/onboarding" className="font-semibold underline">
                  crear o seleccionar una clínica
                </Link>{" "}
                para continuar.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

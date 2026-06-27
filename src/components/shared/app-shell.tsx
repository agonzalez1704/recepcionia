"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { SidebarInterno } from "./app-shell/sidebar-interno";

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
          <Logo height={26} />
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

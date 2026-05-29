import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { NavLink } from "@/components/shared/nav-link";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-slate-100 bg-white">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold text-brand-900">
              Recepción IA
            </Link>
            {orgId && (
              <nav className="flex items-center gap-1 text-sm">
                <NavLink href="/dashboard">Dashboard</NavLink>
                <NavLink href="/mensajes">Mensajes</NavLink>
                <NavLink href="/turnos">Turnos</NavLink>
                <NavLink href="/equipo">Equipo</NavLink>
                <NavLink href="/configuracion">Configuración</NavLink>
                <NavLink href="/integraciones">Integraciones</NavLink>
                <NavLink href="/facturacion">Facturación</NavLink>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
            />
            <UserButton />
          </div>
        </div>
      </header>
      <main className="container flex-1 py-8">
        {!orgId ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            Necesitás{" "}
            <Link href="/onboarding" className="font-semibold underline">
              crear o seleccionar una clínica
            </Link>{" "}
            para continuar.
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

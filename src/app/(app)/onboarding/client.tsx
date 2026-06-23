"use client";

import { useAuth, useUser, useOrganizationList, CreateOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

type EstadoUI = "cargando" | "pidiendo_nombre" | "creando" | "error";

export function OnboardingClient() {
  const router = useRouter();
  const { isLoaded: authReady, orgId } = useAuth();
  const { user, isLoaded: userReady } = useUser();
  const { isLoaded: orgsReady, setActive, userMemberships, createOrganization } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const [nombreClinica, setNombreClinica] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoUI>("cargando");
  const inicializado = useRef(false);

  useEffect(() => {
    if (!authReady || !userReady || !orgsReady || inicializado.current) return;

    // 1) Sesión ya tiene org activa (Clerk's signup la creó) → ir directo a configuración
    if (orgId) {
      inicializado.current = true;
      router.replace("/configuracion");
      return;
    }

    // 2) Usuario tiene memberships pero ninguna activa → activar la primera
    const memberships = userMemberships?.data ?? [];
    if (memberships.length > 0) {
      inicializado.current = true;
      const first = memberships[0];
      void setActive({ organization: first.organization.id }).then(() => router.replace("/configuracion"));
      return;
    }

    // 3) Nombre pre-cargado en metadata → crear org
    const nombre = (user?.unsafeMetadata?.nombre_clinica as string | undefined)?.trim();
    if (nombre) {
      inicializado.current = true;
      void crearClinica(nombre);
      return;
    }

    // 4) Pedir nombre
    inicializado.current = true;
    setEstado("pidiendo_nombre");
  }, [authReady, userReady, orgsReady, orgId, userMemberships, user, setActive, router]);

  async function crearClinica(nombre: string) {
    if (!createOrganization || !user) return;

    // Lock anti-duplicado: sobrevive a remontes del componente y a doble submit
    // (la ref `inicializado` se reinicia al remontar y dejaba crear 2 orgs).
    const lockKey = `recepcionia:creando-org:${user.id}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(lockKey)) return;
    if (typeof window !== "undefined") sessionStorage.setItem(lockKey, "1");

    setEstado("creando");
    setError(null);
    try {
      // Si una org ya existe (carrera con un alta previa), usala en vez de crear otra.
      await userMemberships?.revalidate?.();
      const yaExiste = (userMemberships?.data ?? [])[0];
      if (yaExiste) {
        await setActive({ organization: yaExiste.organization.id });
        router.replace("/configuracion");
        return;
      }

      const org = await createOrganization({ name: nombre });
      await setActive({ organization: org.id });
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, nombre_clinica: undefined } });
      router.replace("/configuracion");
    } catch (err) {
      if (typeof window !== "undefined") sessionStorage.removeItem(lockKey); // permitir reintento
      setError(err instanceof Error ? err.message : "No pudimos crear tu clínica");
      setEstado("error");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const n = nombreClinica.trim();
    if (n.length < 2) {
      setError("El nombre tiene que tener al menos 2 caracteres");
      return;
    }
    void crearClinica(n);
  }

  if (estado === "cargando") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Cargando…
      </div>
    );
  }

  if (estado === "creando") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Creando tu clínica…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Nombre de la clínica <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            required
            minLength={2}
            value={nombreClinica}
            onChange={(e) => setNombreClinica(e.target.value)}
            placeholder="Ej. Consultorio Dental Sonríe"
            className="input"
            autoFocus
          />
          <span className="text-xs text-slate-500">
            Después podés editar la dirección, horarios y servicios.
          </span>
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-brand-900 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
        >
          Crear clínica
        </button>
      </form>

      <details className="text-sm text-slate-600">
        <summary className="cursor-pointer">Opciones avanzadas</summary>
        <div className="mt-3">
          <CreateOrganization afterCreateOrganizationUrl="/configuracion" skipInvitationScreen />
        </div>
      </details>
    </div>
  );
}

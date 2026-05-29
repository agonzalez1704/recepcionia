import type { Organizacion, ActualizarOrganizacion } from "../entities/organizacion";
import type { Turno, CrearTurno, ActualizarTurno, EstadoTurno } from "../entities/turno";
import type { Mensaje, Remitente } from "../entities/mensaje";

export interface OrganizacionRepo {
  buscarPorClerkId(clerkOrgId: string): Promise<Organizacion | null>;
  buscarPorSlugYToken(slug: string, token: string): Promise<Organizacion | null>;
  crear(input: {
    clerk_org_id: string;
    nombre_clinica: string;
    slug: string;
    zona_horaria?: string;
  }): Promise<Organizacion>;
  actualizar(id: string, patch: ActualizarOrganizacion): Promise<Organizacion>;
  regenerarIcsToken(id: string): Promise<string>;
}

export interface TurnoRepo {
  listar(orgId: string, filtros?: { desde?: string; hasta?: string; estado?: EstadoTurno; miembroId?: string | null }): Promise<Turno[]>;
  listarPorTelefono(orgId: string, numero: string): Promise<Turno[]>;
  buscarPorId(orgId: string, id: string): Promise<Turno | null>;
  crear(orgId: string, input: CrearTurno): Promise<Turno>;
  actualizar(orgId: string, id: string, patch: ActualizarTurno): Promise<Turno>;
  haySolapamiento(orgId: string, fecha: string, duracionMin: number, opts?: { excluirId?: string; miembroId?: string | null }): Promise<boolean>;
}

export interface MensajeRepo {
  listar(orgId: string, opts?: { numero?: string; limit?: number; cursor?: string }): Promise<Mensaje[]>;
  ultimos(orgId: string, numero: string, limit: number): Promise<Mensaje[]>;
  crear(orgId: string, input: {
    numero_telefono: string;
    contenido: string;
    remitente: Remitente;
    tipo?: string;
    metadatos?: Record<string, unknown>;
  }): Promise<Mensaje>;
  /** Cuenta mensajes entrantes (paciente) desde una fecha ISO. Proxy de "conversaciones". */
  contarEntrantesDesde(orgId: string, desdeIso: string): Promise<number>;
}

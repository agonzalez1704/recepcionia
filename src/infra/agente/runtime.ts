import type { InsForgeClient } from "@insforge/sdk";
import type { Organizacion } from "@/core/entities/organizacion";
import { crearAgendarTurnoService } from "@/core/services/agendar-turno-service";
import { crearProcesarMensajeService } from "@/core/services/procesar-mensaje-service";
import { crearAgenteIA } from "@/infra/openai/agente-ia";
import { crearToolRegistry } from "@/infra/openai/tool-registry";
import {
  agendarTurnoTool,
  cancelarTurnoTool,
  consultarDisponibilidadTool,
  listarMiembrosTool,
  reprogramarTurnoTool,
  verTurnosPacienteTool,
} from "@/infra/openai/tools";
import { crearMensajeRepo } from "@/infra/insforge/repos/mensaje-repo";
import { crearMiembroRepo } from "@/infra/insforge/repos/miembro-repo";
import { crearTurnoRepo } from "@/infra/insforge/repos/turno-repo";
import { resolverCalendarProvider } from "@/infra/google/calendar";

/**
 * Arma el stack del agente (repos + tools + IA + procesador) para una org.
 * Usado por el webhook de Kapso (WhatsApp).
 */
export async function construirProcesador(admin: InsForgeClient, org: Organizacion) {
  const turnoRepo = crearTurnoRepo(admin);
  const mensajeRepo = crearMensajeRepo(admin);
  const miembroRepo = crearMiembroRepo(admin);
  const miembros = await miembroRepo.listar(org.id, true);

  const agendarService = crearAgendarTurnoService({
    turnoRepo,
    resolverCalendar: (miembroId) => resolverCalendarProvider(org.id, miembroId),
    organizacion: org,
    miembros,
  });

  const registry = crearToolRegistry();
  const depsTools = { turnoRepo, agendarService, miembros };
  registry.registrar(consultarDisponibilidadTool(depsTools));
  registry.registrar(verTurnosPacienteTool(depsTools));
  registry.registrar(listarMiembrosTool(depsTools));
  registry.registrar(agendarTurnoTool(depsTools));
  registry.registrar(cancelarTurnoTool(depsTools));
  registry.registrar(reprogramarTurnoTool(depsTools));

  const ia = crearAgenteIA(registry);
  const procesar = crearProcesarMensajeService({ ia, mensajeRepo, organizacion: org, miembros });

  return { procesar, mensajeRepo };
}

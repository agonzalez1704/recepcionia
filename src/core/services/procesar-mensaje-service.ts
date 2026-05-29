import type { IAProvider, AdjuntoEntrante } from "../ports/ia";
import type { MensajeRepo } from "../ports/repos";
import type { Organizacion } from "../entities/organizacion";
import type { Miembro } from "../entities/miembro";

export type ProcesarMensajeDeps = {
  ia: IAProvider;
  mensajeRepo: MensajeRepo;
  organizacion: Organizacion;
  miembros?: Miembro[];
};

export function crearProcesarMensajeService(deps: ProcesarMensajeDeps) {
  const { ia, mensajeRepo, organizacion, miembros = [] } = deps;

  return {
    async procesar(input: {
      numeroPaciente: string;
      contenido: string;
      messageSid?: string;
      adjuntos?: AdjuntoEntrante[];
      esVozTranscrita?: boolean;
    }): Promise<string> {
      const adjuntos = input.adjuntos ?? [];
      const metadatos: Record<string, unknown> = {};
      if (input.messageSid) metadatos.message_sid = input.messageSid;
      if (adjuntos.length > 0) {
        metadatos.adjuntos = adjuntos.map((a) => a.tipo);
      }
      if (input.esVozTranscrita) metadatos.voz = true;

      // Texto a persistir para el dashboard. Marcamos voz e imágenes.
      let contenidoGuardado = input.contenido.trim();
      if (input.esVozTranscrita && contenidoGuardado) {
        contenidoGuardado = `🎤 ${contenidoGuardado}`;
      }
      if (!contenidoGuardado && adjuntos.length > 0) {
        contenidoGuardado = `📎 ${adjuntos.length} adjunto(s): ${adjuntos.map((a) => a.tipo).join(", ")}`;
      }

      await mensajeRepo.crear(organizacion.id, {
        numero_telefono: input.numeroPaciente,
        contenido: contenidoGuardado,
        remitente: "paciente",
        tipo: input.esVozTranscrita ? "audio" : adjuntos.length > 0 ? "multimedia" : "texto",
        metadatos,
      });

      const historial = await mensajeRepo.ultimos(organizacion.id, input.numeroPaciente, 20);

      let respuesta: string;
      try {
        respuesta = await ia.generarRespuesta({
          organizacion,
          numeroPaciente: input.numeroPaciente,
          historial,
          mensajeEntrante: input.contenido,
          miembros,
          adjuntos,
        });
      } catch (err) {
        console.error("Error agente IA:", err);
        respuesta = `Disculpá, estoy teniendo problemas técnicos. Probá de nuevo en unos minutos${
          organizacion.telefono ? ` o llamá al ${organizacion.telefono}` : ""
        }.`;
      }

      await mensajeRepo.crear(organizacion.id, {
        numero_telefono: input.numeroPaciente,
        contenido: respuesta,
        remitente: "asistente",
      });

      return respuesta;
    },
  };
}

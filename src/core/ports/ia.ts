import type { Mensaje } from "../entities/mensaje";
import type { Organizacion } from "../entities/organizacion";
import type { Miembro } from "../entities/miembro";

export type ToolDef<I, O> = {
  nombre: string;
  descripcion: string;
  parametros: unknown; // JSON schema
  ejecutar: (input: I, ctx: ToolContext) => Promise<O>;
};

export type ToolContext = {
  organizacion: Organizacion;
  numeroPaciente: string;
};

export interface ToolRegistry {
  registrar<I, O>(tool: ToolDef<I, O>): void;
  listar(): ToolDef<unknown, unknown>[];
  obtener(nombre: string): ToolDef<unknown, unknown> | undefined;
}

export type AdjuntoEntrante = {
  tipo: string; // MIME, ej "image/jpeg"
  dataUrl: string; // data:<mime>;base64,<...>
};

export interface IAProvider {
  generarRespuesta(input: {
    organizacion: Organizacion;
    numeroPaciente: string;
    historial: Mensaje[];
    mensajeEntrante: string;
    miembros?: Miembro[];
    adjuntos?: AdjuntoEntrante[];
  }): Promise<string>;
}

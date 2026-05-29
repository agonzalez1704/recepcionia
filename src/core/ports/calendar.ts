export type EventoCalendario = {
  id: string;
  inicio: string;
  fin: string;
  titulo: string;
  descripcion?: string;
};

export type Ocupado = { inicio: string; fin: string };

export interface CalendarProvider {
  crearEvento(input: { inicio: string; fin: string; titulo: string; descripcion?: string }): Promise<string>;
  actualizarEvento(eventId: string, input: { inicio: string; fin: string; titulo: string; descripcion?: string }): Promise<void>;
  eliminarEvento(eventId: string): Promise<void>;
  listarEventos(desde: string, hasta: string): Promise<EventoCalendario[]>;
  /** Solo rangos ocupados, sin detalles. Usa freebusy.query si está disponible. */
  consultarOcupados(desde: string, hasta: string): Promise<Ocupado[]>;
}

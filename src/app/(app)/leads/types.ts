export type Lead = {
  numero_telefono: string;
  nombre_paciente: string | null;
  resultado: string;
  estado: string;
  total_mensajes: number;
  mensajes_paciente: number;
  primer_contacto: string;
  ultimo_contacto: string;
  turno_id: string | null;
};

export type IntegracionGoogleItem = {
  id: string;
  miembro_id: string | null;
  email_google: string;
  calendario_id: string;
  activo: boolean;
};

export type MiembroLite = { id: string; nombre: string; color: string };

export type IntegracionesData = {
  whatsapp: { id: string; numero_whatsapp: string; activo: boolean } | null;
  google: IntegracionGoogleItem[];
  miembros: MiembroLite[];
  ics: { url: string };
};

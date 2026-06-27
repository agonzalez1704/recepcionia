import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import type { CalendarProvider, EventoCalendario } from "@/core/ports/calendar";
import type { IntegracionGoogle } from "@/core/entities/integraciones";
import { crearIntegracionGoogleRepo } from "@/infra/insforge/repos/integracion-google-repo";
import { desencriptar, encriptar } from "@/lib/crypto";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { getServerEnv } from "@/lib/env";

/**
 * Crea un OAuth2Client autenticado para una integración. Auto-refresca el
 * access token si faltan <5 min para expirar y persiste el nuevo en DB.
 */
async function clienteAutenticado(integ: IntegracionGoogle): Promise<OAuth2Client> {
  const env = getServerEnv();
  const client = new OAuth2Client({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  });

  const accessToken = desencriptar(integ.access_token);
  const refreshToken = desencriptar(integ.refresh_token);
  const expira = new Date(integ.expira_en).getTime();

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expira,
  });

  // Refrescar si faltan menos de 5 min
  if (expira - Date.now() < 5 * 60_000) {
    try {
      const { credentials } = await client.refreshAccessToken();
      const nuevoAccess = credentials.access_token;
      const nuevoExpira = credentials.expiry_date;
      if (nuevoAccess && nuevoExpira) {
        client.setCredentials(credentials);
        const repo = crearIntegracionGoogleRepo(getInsforgeAdmin());
        await repo.actualizarTokens(integ.id, {
          access_token: encriptar(nuevoAccess),
          expira_en: new Date(nuevoExpira).toISOString(),
          // refresh token nuevo solo si Google lo rotó
          ...(credentials.refresh_token && credentials.refresh_token !== refreshToken
            ? { refresh_token: encriptar(credentials.refresh_token) }
            : {}),
        });
      }
    } catch (err) {
      console.error("Refresh Google token falló:", err);
      // invalid_grant = el refresh token está revocado/expirado (no se recupera).
      // Desactivamos la integración para dejar de reintentar; el dashboard pedirá
      // reconectar. Otros errores (red, 5xx) son transitorios: no desactivar.
      const code = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      if (code === "invalid_grant") {
        try {
          await crearIntegracionGoogleRepo(getInsforgeAdmin()).desactivar(integ.id);
        } catch (e) {
          console.error("No se pudo desactivar integración Google:", e);
        }
        throw new Error("La conexión con Google Calendar expiró. Reconectala desde Integraciones.");
      }
      throw new Error("No se pudo refrescar el token de Google. Probá de nuevo en unos minutos.");
    }
  }

  return client;
}

export function crearCalendarProviderGoogle(integ: IntegracionGoogle): CalendarProvider {
  return {
    async crearEvento(input) {
      const auth = await clienteAutenticado(integ);
      const cal = google.calendar({ version: "v3", auth });
      const res = await cal.events.insert({
        calendarId: integ.calendario_id,
        requestBody: {
          summary: input.titulo,
          description: input.descripcion,
          start: { dateTime: input.inicio },
          end: { dateTime: input.fin },
        },
      });
      const id = res.data.id;
      if (!id) throw new Error("Google no devolvió event id");
      return id;
    },
    async actualizarEvento(eventId, input) {
      const auth = await clienteAutenticado(integ);
      const cal = google.calendar({ version: "v3", auth });
      await cal.events.update({
        calendarId: integ.calendario_id,
        eventId,
        requestBody: {
          summary: input.titulo,
          description: input.descripcion,
          start: { dateTime: input.inicio },
          end: { dateTime: input.fin },
        },
      });
    },
    async eliminarEvento(eventId) {
      const auth = await clienteAutenticado(integ);
      const cal = google.calendar({ version: "v3", auth });
      try {
        await cal.events.delete({ calendarId: integ.calendario_id, eventId });
      } catch (err: unknown) {
        // 410 = ya eliminado, 404 = no existe. Tratar como éxito.
        const code = (err as { code?: number; response?: { status?: number } }).code
          ?? (err as { response?: { status?: number } }).response?.status;
        if (code !== 404 && code !== 410) throw err;
      }
    },
    async consultarOcupados(desde, hasta) {
      const auth = await clienteAutenticado(integ);
      const cal = google.calendar({ version: "v3", auth });
      const res = await cal.events.list({
        calendarId: integ.calendario_id,
        timeMin: desde,
        timeMax: hasta,
        singleEvents: true,
        orderBy: "startTime",
        showDeleted: false,
        maxResults: 250,
      });
      const items = res.data.items ?? [];
      return items
        .filter((e) => {
          if (e.status === "cancelled") return false;
          const myAttendee = e.attendees?.find((a) => a.self);
          if (myAttendee?.responseStatus === "declined") return false;
          if (!e.start?.dateTime || !e.end?.dateTime) return false;
          return true;
        })
        .map((e) => ({ inicio: e.start!.dateTime!, fin: e.end!.dateTime! }));
    },
    async listarEventos(desde, hasta): Promise<EventoCalendario[]> {
      const auth = await clienteAutenticado(integ);
      const cal = google.calendar({ version: "v3", auth });
      const res = await cal.events.list({
        calendarId: integ.calendario_id,
        timeMin: desde,
        timeMax: hasta,
        singleEvents: true,
        orderBy: "startTime",
      });
      const items = res.data.items ?? [];
      return items
        .filter((e) => e.id && e.start?.dateTime && e.end?.dateTime)
        .map((e) => ({
          id: e.id!,
          inicio: e.start!.dateTime!,
          fin: e.end!.dateTime!,
          titulo: e.summary ?? "",
          descripcion: e.description ?? undefined,
        }));
    },
  };
}

/**
 * Selecciona la integración correcta para un turno según su miembro_id:
 * 1. Si turno.miembro_id tiene integración propia → esa.
 * 2. Si no → integración unificada de la org (miembro_id NULL).
 * 3. Si no hay ninguna → null (sin sync).
 */
export async function resolverCalendarProvider(
  orgId: string,
  miembroId: string | null,
): Promise<CalendarProvider | null> {
  const repo = crearIntegracionGoogleRepo(getInsforgeAdmin());
  if (miembroId) {
    const propia = await repo.buscarPorOrgYMiembro(orgId, miembroId);
    if (propia?.activo) return crearCalendarProviderGoogle(propia);
  }
  const unificada = await repo.buscarPorOrgYMiembro(orgId, null);
  if (unificada?.activo) return crearCalendarProviderGoogle(unificada);
  return null;
}

// =================== Push notifications (sync entrante) ===================

export type CambioEvento = {
  id: string;
  estado: string; // "confirmed" | "cancelled" | "tentative"
  inicio: string | null;
  fin: string | null;
  titulo: string;
};

/**
 * Registra un watch channel para recibir push de cambios del calendario.
 * Devuelve channelId, resourceId y expiración (ms epoch).
 */
export async function registrarWatch(
  integ: IntegracionGoogle,
  webhookUrl: string,
  channelId: string,
): Promise<{ channelId: string; resourceId: string; expiration: string | null }> {
  const auth = await clienteAutenticado(integ);
  const cal = google.calendar({ version: "v3", auth });
  const res = await cal.events.watch({
    calendarId: integ.calendario_id,
    requestBody: { id: channelId, type: "web_hook", address: webhookUrl },
  });
  return {
    channelId,
    resourceId: res.data.resourceId ?? "",
    expiration: res.data.expiration ?? null,
  };
}

/** Detiene un watch channel. */
export async function detenerWatch(integ: IntegracionGoogle): Promise<void> {
  if (!integ.canal_id || !integ.resource_id) return;
  try {
    const auth = await clienteAutenticado(integ);
    const cal = google.calendar({ version: "v3", auth });
    await cal.channels.stop({ requestBody: { id: integ.canal_id, resourceId: integ.resource_id } });
  } catch (err) {
    console.error("No se pudo detener watch:", err);
  }
}

/**
 * Trae los cambios desde el último syncToken. Devuelve eventos cambiados +
 * nuevo syncToken. Si el token expiró (410), devuelve resyncRequerido=true.
 */
export async function listarCambios(
  integ: IntegracionGoogle,
): Promise<{ cambios: CambioEvento[]; nextSyncToken: string | null; resyncRequerido: boolean }> {
  const auth = await clienteAutenticado(integ);
  const cal = google.calendar({ version: "v3", auth });
  try {
    const params: Record<string, unknown> = {
      calendarId: integ.calendario_id,
      singleEvents: true,
      showDeleted: true,
      maxResults: 250,
    };
    if (integ.sync_token) {
      params.syncToken = integ.sync_token;
    } else {
      // Primera vez: acotar a ventana futura para obtener un syncToken inicial.
      params.timeMin = new Date().toISOString();
    }
    const res = await cal.events.list(params);
    const items = res.data.items ?? [];
    const cambios: CambioEvento[] = items
      .filter((e) => e.id)
      .map((e) => ({
        id: e.id!,
        estado: e.status ?? "confirmed",
        inicio: e.start?.dateTime ?? null,
        fin: e.end?.dateTime ?? null,
        titulo: e.summary ?? "",
      }));
    return { cambios, nextSyncToken: res.data.nextSyncToken ?? null, resyncRequerido: false };
  } catch (err: unknown) {
    const code = (err as { code?: number; response?: { status?: number } }).code
      ?? (err as { response?: { status?: number } }).response?.status;
    if (code === 410) {
      // syncToken inválido → hay que resincronizar desde cero.
      return { cambios: [], nextSyncToken: null, resyncRequerido: true };
    }
    throw err;
  }
}

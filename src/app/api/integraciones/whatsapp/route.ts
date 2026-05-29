import { z } from "zod";
import { ok, manejarError } from "@/lib/api";
import { encriptar } from "@/lib/crypto";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearIntegracionWhatsAppRepo } from "@/infra/insforge/repos/integracion-whatsapp-repo";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const Input = z.object({
  numero_whatsapp: z.string().min(5),
  twilio_account_sid: z.string().optional().default(""),
  twilio_auth_token: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") {
      throw new HttpError(403, "no_autorizado", "Solo administradores pueden configurar integraciones");
    }
    const body = await req.json().catch(() => null);
    const parsed = Input.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(400, "datos_invalidos", "Datos inválidos", parsed.error.flatten());
    }

    const repo = crearIntegracionWhatsAppRepo(getInsforgeAdmin());
    const existente = await repo.buscarPorOrg(ctx.organizacion.id);

    const sidPlano = parsed.data.twilio_account_sid.trim();
    const tokenPlano = parsed.data.twilio_auth_token.trim();

    // Edit con creds vacías → reusar las existentes cifradas
    let twilio_account_sid: string;
    let twilio_auth_token: string;
    if (sidPlano) {
      twilio_account_sid = encriptar(sidPlano);
    } else if (existente) {
      twilio_account_sid = existente.twilio_account_sid;
    } else {
      throw new HttpError(400, "datos_invalidos", "Falta Account SID");
    }
    if (tokenPlano) {
      twilio_auth_token = encriptar(tokenPlano);
    } else if (existente) {
      twilio_auth_token = existente.twilio_auth_token;
    } else {
      throw new HttpError(400, "datos_invalidos", "Falta Auth Token");
    }

    const guardado = await repo.upsert(ctx.organizacion.id, {
      numero_whatsapp: parsed.data.numero_whatsapp.trim(),
      twilio_account_sid,
      twilio_auth_token,
      activo: true,
    });

    return ok({ id: guardado.id, numero_whatsapp: guardado.numero_whatsapp, activo: guardado.activo });
  } catch (e) {
    return manejarError(e);
  }
}

export async function DELETE() {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") {
      throw new HttpError(403, "no_autorizado", "Solo administradores");
    }
    const repo = crearIntegracionWhatsAppRepo(getInsforgeAdmin());
    await repo.eliminar(ctx.organizacion.id);
    return ok({ eliminado: true });
  } catch (e) {
    return manejarError(e);
  }
}

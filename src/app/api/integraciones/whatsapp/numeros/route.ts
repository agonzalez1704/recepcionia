import { z } from "zod";
import { ok, manejarError } from "@/lib/api";
import { buscarNumerosDisponibles } from "@/infra/twilio/senders";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const PAISES_OK = z.enum(["MX", "AR", "CL", "CO", "PE", "UY", "US", "ES"]);

export async function GET(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") throw new HttpError(403, "no_autorizado", "Solo administradores");
    const url = new URL(req.url);
    const paisRaw = url.searchParams.get("pais") ?? "MX";
    const parsed = PAISES_OK.safeParse(paisRaw);
    if (!parsed.success) throw new HttpError(400, "pais_invalido", "País no soportado");
    const numeros = await buscarNumerosDisponibles(parsed.data, 5);
    return ok({ numeros });
  } catch (e) {
    return manejarError(e);
  }
}

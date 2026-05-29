import { NextResponse } from "next/server";
import { crearClienteOAuth, firmarEstado, SCOPES_GOOGLE } from "@/infra/google/oauth";
import { manejarError } from "@/lib/api";
import { getActiveContextOrThrow, HttpError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ctx = await getActiveContextOrThrow();
    if (ctx.orgRole !== "org:admin") {
      throw new HttpError(403, "no_autorizado", "Solo administradores pueden conectar Google");
    }

    const url = new URL(req.url);
    const miembroId = url.searchParams.get("miembro_id");

    const state = firmarEstado({
      orgId: ctx.clerkOrgId,
      userId: ctx.userId,
      miembroId: miembroId || null,
    });

    const client = crearClienteOAuth();
    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // forzar refresh_token siempre
      scope: SCOPES_GOOGLE,
      state,
    });

    return NextResponse.redirect(authUrl);
  } catch (e) {
    return manejarError(e);
  }
}

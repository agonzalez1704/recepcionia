import { NextResponse } from "next/server";
import { google } from "googleapis";
import { crearClienteOAuth, verificarEstado } from "@/infra/google/oauth";
import { crearIntegracionGoogleRepo } from "@/infra/insforge/repos/integracion-google-repo";
import { crearOrganizacionRepo } from "@/infra/insforge/repos/organizacion-repo";
import { encriptar } from "@/lib/crypto";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

function errorRedirect(motivo: string) {
  const env = getServerEnv();
  return NextResponse.redirect(`${env.APP_BASE_URL}/integraciones?google_error=${encodeURIComponent(motivo)}`);
}

function okRedirect(email: string) {
  const env = getServerEnv();
  return NextResponse.redirect(`${env.APP_BASE_URL}/integraciones?google_ok=${encodeURIComponent(email)}`);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errParam = url.searchParams.get("error");

  if (errParam) return errorRedirect(errParam);
  if (!code || !state) return errorRedirect("faltan_parametros");

  let estado;
  try {
    estado = verificarEstado(state);
  } catch (e) {
    return errorRedirect(e instanceof Error ? e.message : "state_invalido");
  }

  try {
    const client = crearClienteOAuth();
    const { tokens } = await client.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      return errorRedirect("tokens_incompletos");
    }
    client.setCredentials(tokens);

    // Email del usuario Google
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    if (!email) return errorRedirect("email_no_disponible");

    // Resolver org en InsForge
    const admin = getInsforgeAdmin();
    const orgRepo = crearOrganizacionRepo(admin);
    const org = await orgRepo.buscarPorClerkId(estado.orgId);
    if (!org) return errorRedirect("org_no_encontrada");

    const googleRepo = crearIntegracionGoogleRepo(admin);
    await googleRepo.upsert(org.id, {
      miembro_id: estado.miembroId,
      usuario_clerk_id: estado.userId,
      email_google: email,
      access_token: encriptar(tokens.access_token),
      refresh_token: encriptar(tokens.refresh_token),
      calendario_id: "primary",
      expira_en: new Date(tokens.expiry_date).toISOString(),
    });

    return okRedirect(email);
  } catch (err) {
    console.error("OAuth Google callback error:", err);
    return errorRedirect("error_interno");
  }
}

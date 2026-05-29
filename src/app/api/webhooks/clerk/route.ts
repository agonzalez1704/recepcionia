import { headers } from "next/headers";
import { Webhook } from "svix";
import { getServerEnv } from "@/lib/env";
import { getInsforgeAdmin } from "@/lib/insforge-admin";
import { crearOrganizacionRepo, slugify } from "@/infra/insforge/repos/organizacion-repo";

type ClerkEvent =
  | {
      type: "organization.created" | "organization.updated";
      data: { id: string; name: string; slug?: string | null };
    }
  | {
      type: "organization.deleted";
      data: { id: string };
    }
  | { type: string; data: unknown };

export async function POST(req: Request) {
  const env = getServerEnv();
  if (!env.CLERK_WEBHOOK_SIGNING_SECRET) {
    return new Response("CLERK_WEBHOOK_SIGNING_SECRET no configurado", { status: 503 });
  }

  const payload = await req.text();
  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTs = h.get("svix-timestamp");
  const svixSig = h.get("svix-signature");
  if (!svixId || !svixTs || !svixSig) {
    return new Response("Headers Svix faltantes", { status: 400 });
  }

  let event: ClerkEvent;
  try {
    const wh = new Webhook(env.CLERK_WEBHOOK_SIGNING_SECRET);
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTs,
      "svix-signature": svixSig,
    }) as ClerkEvent;
  } catch (err) {
    console.error("Webhook Clerk: firma inválida", err);
    return new Response("Firma inválida", { status: 400 });
  }

  const admin = getInsforgeAdmin();
  const repo = crearOrganizacionRepo(admin);

  try {
    if (event.type === "organization.created") {
      const d = event.data as { id: string; name: string; slug?: string | null };
      const existing = await repo.buscarPorClerkId(d.id);
      if (!existing) {
        await repo.crear({
          clerk_org_id: d.id,
          nombre_clinica: d.name,
          slug: d.slug ?? slugify(d.name + "-" + d.id.slice(-6)),
        });
      }
    } else if (event.type === "organization.deleted") {
      const d = event.data as { id: string };
      await admin.database.from("organizaciones").delete().eq("clerk_org_id", d.id);
    }
  } catch (err) {
    console.error("Webhook Clerk: error al sincronizar", err);
    return new Response("Error interno", { status: 500 });
  }

  return Response.json({ ok: true });
}

import { getServerEnv } from "@/lib/env";

const META_VERSION = "v24.0";

function base(): string {
  const env = getServerEnv();
  return env.KAPSO_API_BASE_URL || "https://api.kapso.ai";
}

async function kapso<T>(path: string, init?: RequestInit): Promise<T> {
  const env = getServerEnv();
  if (!env.KAPSO_API_KEY) throw new Error("KAPSO_API_KEY no configurado");
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      "X-API-Key": env.KAPSO_API_KEY,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`Kapso ${res.status}: ${json?.error?.message ?? text ?? "error"}`);
  }
  return json as T;
}

// ---------------- Customers ----------------

type Customer = { id: string; external_customer_id: string | null; name: string };

/** Busca el customer Kapso por external_customer_id (= clerk_org_id) o lo crea. */
export async function asegurarCustomer(clerkOrgId: string, nombre: string): Promise<string> {
  const lista = await kapso<{ data: Customer[] }>(`/platform/v1/customers?per_page=100`);
  const existente = lista.data.find((c) => c.external_customer_id === clerkOrgId);
  if (existente) return existente.id;
  const creado = await kapso<{ data: Customer }>(`/platform/v1/customers`, {
    method: "POST",
    body: JSON.stringify({ customer: { name: nombre, external_customer_id: clerkOrgId } }),
  });
  return creado.data.id;
}

// ---------------- Setup links ----------------

export type SetupLinkInput = {
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  language?: string;
  allowedConnectionTypes?: ("coexistence" | "dedicated")[];
  themeConfig?: Record<string, string>;
};

export async function crearSetupLink(customerId: string, input: SetupLinkInput): Promise<{ url: string; expiresAt: string }> {
  const body = {
    setup_link: {
      success_redirect_url: input.successRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl,
      language: input.language ?? "es",
      allowed_connection_types: input.allowedConnectionTypes ?? ["coexistence", "dedicated"],
      theme_config: input.themeConfig,
    },
  };
  const r = await kapso<{ data: { url: string; expires_at: string } }>(
    `/platform/v1/customers/${customerId}/setup_links`,
    { method: "POST", body: JSON.stringify(body) },
  );
  return { url: r.data.url, expiresAt: r.data.expires_at };
}

// ---------------- Phone-number webhook ----------------

const EVENTOS_MENSAJE = ["whatsapp.message.received"];

/** Crea (idempotente-ish) un webhook de mensajes para el phone_number_id. Devuelve secret. */
export async function crearWebhookMensajes(
  phoneNumberId: string,
  webhookUrl: string,
): Promise<{ id: string; secret: string }> {
  const r = await kapso<{ data: { id: string; secret_key?: string; secret?: string } }>(
    `/platform/v1/whatsapp/phone_numbers/${phoneNumberId}/webhooks`,
    {
      method: "POST",
      body: JSON.stringify({
        webhook: {
          url: webhookUrl,
          events: EVENTOS_MENSAJE,
          kind: "kapso",
          payload_version: "v2",
          buffer_enabled: true,
          buffer_window_seconds: 5,
          active: true,
        },
      }),
    },
  );
  return { id: r.data.id, secret: r.data.secret_key ?? r.data.secret ?? "" };
}

// ---------------- Send message (Meta proxy) ----------------

export async function enviarTexto(phoneNumberId: string, to: string, body: string): Promise<void> {
  await kapso(`/meta/whatsapp/${META_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });
}

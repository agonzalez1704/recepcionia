-- Modelo Kapso: cada org = customer Kapso + número conectado via embedded signup.
-- Routing inbound por phone_number_id (Meta). webhook_secret por phone-number webhook.

alter table public.integraciones_whatsapp
  add column if not exists kapso_customer_id text,
  add column if not exists phone_number_id text,
  add column if not exists business_account_id text,
  add column if not exists display_phone_number text,
  add column if not exists connection_type text,        -- coexistence | dedicated
  add column if not exists webhook_secret text;          -- cifrado, para verificar firma del phone-number webhook

create index if not exists integraciones_whatsapp_phone_number_id_idx
  on public.integraciones_whatsapp (phone_number_id) where phone_number_id is not null;

-- En Kapso el número se conoce recién al completar el embedded signup.
alter table public.integraciones_whatsapp alter column numero_whatsapp drop not null;

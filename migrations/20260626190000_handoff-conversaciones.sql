-- Handoff a humano: estado por (org, número de paciente). Cuando un paciente
-- pide hablar con la clínica (o el agente deriva), la conversación pasa a
-- 'humano' y el bot deja de responder hasta que el staff lo reactive.

create table if not exists public.conversaciones_whatsapp (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  numero_telefono text not null,
  estado text not null default 'bot',   -- 'bot' | 'humano'
  motivo text,
  derivado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (organizacion_id, numero_telefono)
);

create index if not exists conversaciones_whatsapp_org_idx
  on public.conversaciones_whatsapp (organizacion_id);

alter table public.conversaciones_whatsapp enable row level security;

create policy "Ver conversaciones propias" on public.conversaciones_whatsapp for select
  using (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()));

create policy "Modificar conversaciones propias" on public.conversaciones_whatsapp for all
  using (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()))
  with check (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()));

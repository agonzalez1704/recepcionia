-- Initial schema: multi-tenant SaaS for medical appointment AI agent
-- Clerk Organizations bridged via clerk_org_id. RLS isolates rows per org
-- using requesting_user_id() helper (Clerk JWT 'sub' claim).

create extension if not exists "pgcrypto";

-- =========================================================================
-- Auth helpers
-- =========================================================================
create or replace function public.requesting_user_id()
returns text language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::text
$$;

create or replace function public.requesting_org_id()
returns text language sql stable as $$
  select nullif(auth.jwt() ->> 'org_id', '')::text
$$;

-- =========================================================================
-- organizaciones
-- =========================================================================
create table public.organizaciones (
  id uuid primary key default gen_random_uuid(),
  clerk_org_id text not null unique,
  nombre_clinica text not null,
  slug text not null unique,
  direccion text,
  telefono text,
  email text,
  horarios jsonb not null default '[]'::jsonb,
  servicios jsonb not null default '[]'::jsonb,
  sobre_clinica text,
  zona_horaria text not null default 'America/Mexico_City',
  ics_token text not null unique default encode(gen_random_bytes(24), 'base64'),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index organizaciones_clerk_org_id_idx on public.organizaciones (clerk_org_id);

alter table public.organizaciones enable row level security;

create policy "Ver propia organizacion" on public.organizaciones for select
  using (clerk_org_id = requesting_org_id());

create policy "Actualizar propia organizacion" on public.organizaciones for update
  using (clerk_org_id = requesting_org_id());

-- =========================================================================
-- integraciones_whatsapp
-- =========================================================================
create table public.integraciones_whatsapp (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  proveedor text not null default 'twilio',
  numero_whatsapp text not null unique,
  twilio_account_sid text not null,
  twilio_auth_token text not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index integraciones_whatsapp_org_idx on public.integraciones_whatsapp (organizacion_id);
create index integraciones_whatsapp_numero_idx on public.integraciones_whatsapp (numero_whatsapp);

alter table public.integraciones_whatsapp enable row level security;

create policy "Ver integracion WhatsApp propia" on public.integraciones_whatsapp for select
  using (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()));

create policy "Modificar integracion WhatsApp propia" on public.integraciones_whatsapp for all
  using (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()))
  with check (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()));

-- =========================================================================
-- integraciones_google
-- =========================================================================
create table public.integraciones_google (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  usuario_clerk_id text not null,
  email_google text not null,
  access_token text not null,
  refresh_token text not null,
  calendario_id text not null default 'primary',
  expira_en timestamptz not null,
  canal_id text,
  resource_id text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (organizacion_id)
);

create index integraciones_google_org_idx on public.integraciones_google (organizacion_id);

alter table public.integraciones_google enable row level security;

create policy "Ver integracion Google propia" on public.integraciones_google for select
  using (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()));

create policy "Modificar integracion Google propia" on public.integraciones_google for all
  using (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()))
  with check (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()));

-- =========================================================================
-- mensajes_whatsapp
-- =========================================================================
create table public.mensajes_whatsapp (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  numero_telefono text not null,
  contenido text not null,
  remitente text not null check (remitente in ('paciente', 'asistente')),
  tipo text not null default 'texto',
  metadatos jsonb,
  recibido_en timestamptz not null default now()
);

create index mensajes_org_recibido_idx on public.mensajes_whatsapp (organizacion_id, recibido_en desc);
create index mensajes_org_numero_idx on public.mensajes_whatsapp (organizacion_id, numero_telefono, recibido_en desc);

alter table public.mensajes_whatsapp enable row level security;

create policy "Ver mensajes propios" on public.mensajes_whatsapp for select
  using (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()));

-- =========================================================================
-- turnos
-- =========================================================================
create table public.turnos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  numero_telefono text not null,
  nombre_paciente text not null,
  fecha_turno timestamptz not null,
  duracion_min integer not null default 30 check (duracion_min > 0),
  servicio text not null default 'Consulta',
  estado text not null default 'confirmado' check (estado in ('pendiente', 'confirmado', 'cancelado', 'completado')),
  notas text,
  google_event_id text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index turnos_org_fecha_idx on public.turnos (organizacion_id, fecha_turno);
create index turnos_org_numero_idx on public.turnos (organizacion_id, numero_telefono);

alter table public.turnos enable row level security;

create policy "Ver turnos propios" on public.turnos for select
  using (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()));

create policy "Modificar turnos propios" on public.turnos for all
  using (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()))
  with check (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()));

-- =========================================================================
-- updated_at trigger
-- =========================================================================
create or replace function public.touch_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger trg_organizaciones_actualizado_en
  before update on public.organizaciones
  for each row execute function public.touch_actualizado_en();

create trigger trg_turnos_actualizado_en
  before update on public.turnos
  for each row execute function public.touch_actualizado_en();

create trigger trg_int_whatsapp_actualizado_en
  before update on public.integraciones_whatsapp
  for each row execute function public.touch_actualizado_en();

create trigger trg_int_google_actualizado_en
  before update on public.integraciones_google
  for each row execute function public.touch_actualizado_en();

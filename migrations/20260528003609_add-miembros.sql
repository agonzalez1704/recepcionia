-- Staff/profesionales de la clinica. Cada turno se asigna a un miembro;
-- la disponibilidad se calcula por miembro (cada uno tiene su agenda).

create table public.miembros (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre text not null,
  rol text,
  servicios jsonb not null default '[]'::jsonb,
  horarios jsonb not null default '[]'::jsonb,
  color text not null default '#0EA5E9',
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index miembros_org_idx on public.miembros (organizacion_id);

alter table public.miembros enable row level security;

create policy "Ver miembros propios" on public.miembros for select
  using (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()));

create policy "Modificar miembros propios" on public.miembros for all
  using (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()))
  with check (organizacion_id in (select id from public.organizaciones where clerk_org_id = requesting_org_id()));

create trigger trg_miembros_actualizado_en
  before update on public.miembros
  for each row execute function public.touch_actualizado_en();

alter table public.turnos add column miembro_id uuid references public.miembros(id) on delete set null;
create index turnos_miembro_fecha_idx on public.turnos (miembro_id, fecha_turno) where miembro_id is not null;

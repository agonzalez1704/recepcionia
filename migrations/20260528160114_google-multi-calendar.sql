-- Permitir multiples integraciones Google por organizacion:
-- - Una "unificada" (miembro_id = NULL) que recibe turnos sin miembro asignado
-- - Una por miembro (miembro_id = id) que recibe turnos asignados a ese miembro
-- Drop unique(organizacion_id) y reemplazar con unique(organizacion_id, miembro_id)
-- usando indice parcial para tratar NULL como valor distinguible.

alter table public.integraciones_google add column if not exists miembro_id uuid references public.miembros(id) on delete cascade;

alter table public.integraciones_google drop constraint if exists integraciones_google_organizacion_id_key;

-- Indice unico para miembro_id NOT NULL: solo 1 integracion por miembro
create unique index if not exists integraciones_google_org_miembro_idx
  on public.integraciones_google (organizacion_id, miembro_id)
  where miembro_id is not null;

-- Indice unico para integracion "unificada" (miembro_id IS NULL): solo 1 por org
create unique index if not exists integraciones_google_org_unificada_idx
  on public.integraciones_google (organizacion_id)
  where miembro_id is null;

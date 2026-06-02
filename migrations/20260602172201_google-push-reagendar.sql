-- Sync entrante Google Calendar (push notifications) + estado 'necesita_reagendar'.

-- Nuevo estado de turno: cuando un evento externo de Google pisa un turno confirmado.
alter table public.turnos drop constraint if exists turnos_estado_check;
alter table public.turnos add constraint turnos_estado_check
  check (estado in ('pendiente', 'confirmado', 'cancelado', 'completado', 'necesita_reagendar'));

-- Datos del watch channel para sync entrante.
alter table public.integraciones_google
  add column if not exists sync_token text,
  add column if not exists canal_expira_en timestamptz;

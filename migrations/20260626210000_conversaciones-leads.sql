-- Tracking de leads / performance del agente. Extendemos conversaciones_whatsapp
-- con metadata de lead (nombre, resultado, turno reservado) y una función de
-- resumen que agrega los mensajes por número.

alter table public.conversaciones_whatsapp
  add column if not exists nombre_paciente text,
  add column if not exists resultado text not null default 'en_curso',  -- en_curso | agendo | derivado | cerrado
  add column if not exists turno_id uuid;

-- Resumen por conversación (lead): agrega mensajes + metadata. SECURITY DEFINER
-- porque cruza tablas; el caller (admin) pasa su propio org_id ya autenticado.
create or replace function public.conversaciones_resumen(p_org_id uuid)
returns table (
  numero_telefono text,
  nombre_paciente text,
  resultado text,
  estado text,
  total_mensajes bigint,
  mensajes_paciente bigint,
  primer_contacto timestamptz,
  ultimo_contacto timestamptz,
  turno_id uuid
)
language sql
security definer
set search_path = public
as $$
  select
    m.numero_telefono,
    c.nombre_paciente,
    coalesce(c.resultado, 'en_curso') as resultado,
    coalesce(c.estado, 'bot') as estado,
    count(*) as total_mensajes,
    count(*) filter (where m.remitente = 'paciente') as mensajes_paciente,
    min(m.recibido_en) as primer_contacto,
    max(m.recibido_en) as ultimo_contacto,
    c.turno_id
  from public.mensajes_whatsapp m
  left join public.conversaciones_whatsapp c
    on c.organizacion_id = m.organizacion_id and c.numero_telefono = m.numero_telefono
  where m.organizacion_id = p_org_id
  group by m.numero_telefono, c.nombre_paciente, c.resultado, c.estado, c.turno_id
  order by max(m.recibido_en) desc;
$$;

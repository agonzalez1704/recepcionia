-- Especialidad del miembro: texto corto para triage de la IA.
-- Ej: "Gastroenterologia", "Psiquiatria", "Tatuaje black & gray".
alter table public.miembros add column if not exists especialidad text;

-- Bio/descripcion mas larga opcional para dar contexto a la IA al recomendar.
alter table public.miembros add column if not exists bio text;

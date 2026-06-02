-- Modelo ISV: una cuenta Twilio parent (nuestra). Por clinica guardamos el
-- numero dedicado + el sender de WhatsApp registrado bajo nuestra WABA.
-- Ya no guardamos credenciales Twilio por org (quedan nullable por compat).

alter table public.integraciones_whatsapp
  add column if not exists sender_sid text,            -- XE... sender de WhatsApp
  add column if not exists telefono_sid text,          -- PN... numero comprado en Twilio
  add column if not exists pais text,                  -- ISO country, ej "MX"
  add column if not exists estado_sender text not null default 'sin_configurar';
  -- estado_sender: sin_configurar | creando | pendiente_otp | en_revision | online | offline

-- Las credenciales por-org ya no son obligatorias (modelo ISV usa parent token).
alter table public.integraciones_whatsapp alter column twilio_account_sid drop not null;
alter table public.integraciones_whatsapp alter column twilio_auth_token drop not null;

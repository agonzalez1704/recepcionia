-- PostgREST solo expone el schema public. Las tablas payments.* no son
-- accesibles via .from(). Esta funcion SECURITY DEFINER lee el schema payments
-- y devuelve el estado de suscripcion de una org, llamable via .rpc().

create or replace function public.billing_estado_org(p_org_id text, p_env text)
returns table (
  stripe_subscription_id text,
  status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  stripe_price_id text
)
language sql
security definer
set search_path = payments, public
as $$
  select
    s.stripe_subscription_id,
    s.status,
    s.current_period_end,
    s.cancel_at_period_end,
    si.stripe_price_id
  from payments.subscriptions s
  left join payments.subscription_items si
    on si.stripe_subscription_id = s.stripe_subscription_id
  where s.subject_type = 'org'
    and s.subject_id = p_org_id
    and s.environment = p_env
  order by
    case s.status
      when 'active' then 0
      when 'trialing' then 1
      when 'past_due' then 2
      else 3
    end,
    s.created_at desc;
$$;

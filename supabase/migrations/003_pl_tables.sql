-- Biblia Wewnętrzna (Polish app) — its own tables in the shared Supabase project.
-- Same shape as 001/002 with the "pl_" prefix (SITE.dbPrefix), so Polish buyers,
-- conversations and limits never mix with the Spanish app. Server-only (RLS, no policies).

create table if not exists public.pl_kashpay_events (
  id bigserial primary key,
  received_at timestamptz not null default now(),
  event text,
  email text,
  product text,
  headers jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  signature_ok boolean,
  processed boolean not null default false,
  note text
);
create index if not exists pl_kashpay_events_email_idx on public.pl_kashpay_events (email, received_at desc);

create table if not exists public.pl_entitlements (
  email text not null,
  offer text not null check (offer in ('front', 'upsell1', 'upsell2')),
  status text not null check (status in ('active', 'past_due', 'canceled', 'refunded')),
  current_period_end timestamptz,
  source text not null default 'kashpay',
  product text,
  updated_at timestamptz not null default now(),
  primary key (email, offer)
);

create table if not exists public.pl_members (
  email text primary key,
  name text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  offer_started_at timestamptz
);

create table if not exists public.pl_consejero_messages (
  id bigserial primary key,
  email text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  crisis boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists pl_consejero_messages_email_idx on public.pl_consejero_messages (email, created_at desc);

create table if not exists public.pl_consejero_usage (
  email text not null,
  day date not null,
  count integer not null default 0,
  primary key (email, day)
);

create table if not exists public.pl_app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.pl_push_subscriptions (
  endpoint text primary key,
  email text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  last_sent_day date
);
create index if not exists pl_push_subscriptions_email_idx on public.pl_push_subscriptions (email);

alter table public.pl_kashpay_events enable row level security;
alter table public.pl_entitlements enable row level security;
alter table public.pl_members enable row level security;
alter table public.pl_consejero_messages enable row level security;
alter table public.pl_consejero_usage enable row level security;
alter table public.pl_app_config enable row level security;
alter table public.pl_push_subscriptions enable row level security;

grant all on public.pl_kashpay_events, public.pl_entitlements, public.pl_members, public.pl_consejero_messages,
  public.pl_consejero_usage, public.pl_app_config, public.pl_push_subscriptions to service_role;
grant usage, select on all sequences in schema public to service_role;

create or replace function public.pl_consejero_count(p_email text, p_day date)
returns integer language sql as $$
  insert into public.pl_consejero_usage (email, day, count) values (p_email, p_day, 1)
  on conflict (email, day) do update set count = public.pl_consejero_usage.count + 1
  returning count;
$$;
grant execute on function public.pl_consejero_count(text, date) to service_role;

-- Same web-push key pair as the Spanish app (the public key is in lib/config.ts).
insert into public.pl_app_config (key, value)
select key, value from public.app_config where key = 'vapid_private_key'
on conflict (key) do nothing;

notify pgrst, 'reload schema';

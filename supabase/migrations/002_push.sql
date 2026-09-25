-- Daily reminder notifications (web push) + server-only settings.

-- Secrets the server needs that don't belong in the code (e.g. the push private key).
create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- One row per device that accepted notifications.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  email text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  last_sent_day date
);
create index if not exists push_subscriptions_email_idx on public.push_subscriptions (email);

alter table public.app_config enable row level security;
alter table public.push_subscriptions enable row level security;
grant all on public.app_config, public.push_subscriptions to service_role;

notify pgrst, 'reload schema';

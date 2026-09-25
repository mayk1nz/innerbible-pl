-- La Biblia Interior — first schema.
-- Only the server (service role) reads and writes: RLS on with no policies, so the
-- public API keys can't touch any of this.

-- Every KashPay webhook exactly as it arrived (the source of truth for access).
create table if not exists public.kashpay_events (
  id bigserial primary key,
  received_at timestamptz not null default now(),
  event text,
  email text,
  product text,
  headers jsonb not null default '{}'::jsonb,
  payload jsonb not null,
  signature_ok boolean,          -- null = no signature to check yet
  processed boolean not null default false,
  note text
);
create index if not exists kashpay_events_email_idx on public.kashpay_events (email, received_at desc);

-- What each e-mail can open. One row per offer; subscriptions carry the paid-until date.
create table if not exists public.entitlements (
  email text not null,
  offer text not null check (offer in ('front', 'upsell1', 'upsell2')),
  status text not null check (status in ('active', 'past_due', 'canceled', 'refunded')),
  current_period_end timestamptz,        -- null = no end (e.g. granted by hand)
  source text not null default 'kashpay', -- 'kashpay' | 'manual'
  product text,
  updated_at timestamptz not null default now(),
  primary key (email, offer)
);

-- Members: first/last login and the start of their personal Consejero offer.
create table if not exists public.members (
  email text primary key,
  name text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  offer_started_at timestamptz
);

-- Tu Consejero Bíblico: the conversation, kept for the member only.
create table if not exists public.consejero_messages (
  id bigserial primary key,
  email text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  crisis boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists consejero_messages_email_idx on public.consejero_messages (email, created_at desc);

-- Messages per member per day (limit of 30, or 1 free question for non-members).
create table if not exists public.consejero_usage (
  email text not null,
  day date not null,
  count integer not null default 0,
  primary key (email, day)
);

alter table public.kashpay_events enable row level security;
alter table public.entitlements enable row level security;
alter table public.members enable row level security;
alter table public.consejero_messages enable row level security;
alter table public.consejero_usage enable row level security;

grant all on public.kashpay_events, public.entitlements, public.members, public.consejero_messages, public.consejero_usage to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Count one Consejero message atomically; returns the new count for that day.
create or replace function public.consejero_count(p_email text, p_day date)
returns integer language sql as $$
  insert into public.consejero_usage (email, day, count) values (p_email, p_day, 1)
  on conflict (email, day) do update set count = public.consejero_usage.count + 1
  returning count;
$$;
grant execute on function public.consejero_count(text, date) to service_role;

notify pgrst, 'reload schema';

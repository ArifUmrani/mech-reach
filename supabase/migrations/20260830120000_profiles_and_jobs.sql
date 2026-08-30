-- Apply with: npx supabase db push
-- Angular uses only the publishable key. RLS is the access control.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  mobile_e164 text not null default '',
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_mobile_e164_key
  on public.profiles (mobile_e164)
  where mobile_e164 <> '';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, mobile_e164)
  values (new.id, coalesce(new.phone, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default (
    'MR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  help_kind text not null check (help_kind in ('roadside', 'doorstep')),
  service_id text not null,
  service_title text not null,
  other_details text not null default '',
  vehicle_kind text not null check (vehicle_kind in ('car', 'bike')),
  vehicle_detail text not null default '',
  city text not null,
  location_text text not null,
  notes text not null default '',
  scheduled_at timestamptz,
  status text not null default 'requested' check (status = 'requested'),
  created_at timestamptz not null default now()
);

create or replace function public.jobs_force_insert_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.customer_id := auth.uid();
  new.status := 'requested';
  new.reference := 'MR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  return new;
end;
$$;

drop trigger if exists jobs_force_insert_defaults on public.jobs;
create trigger jobs_force_insert_defaults
  before insert on public.jobs
  for each row execute procedure public.jobs_force_insert_defaults();

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists jobs_select_own on public.jobs;
create policy jobs_select_own
  on public.jobs
  for select
  to authenticated
  using (customer_id = auth.uid());

drop policy if exists jobs_insert_own on public.jobs;
create policy jobs_insert_own
  on public.jobs
  for insert
  to authenticated
  with check (customer_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.jobs to authenticated;

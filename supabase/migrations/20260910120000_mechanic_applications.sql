-- Apply with: npx supabase db push
-- Mechanic applications and private document storage. Angular uses only the
-- publishable key; RLS and this trigger are the access control.

create table if not exists public.mechanic_applications (
  id uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  photo_path text,
  practice_kind text not null check (practice_kind in ('independent', 'workshop')),
  workshop_name text not null default '',
  years_experience smallint not null default 0 check (years_experience between 0 and 50),
  vehicle_kind text not null check (vehicle_kind in ('car', 'bike', 'both')),
  service_ids text[] not null default '{}',
  other_services text not null default '',
  coverage_kind text not null check (coverage_kind in ('roadside', 'doorstep', 'both')),
  city text not null,
  service_areas text not null default '',
  travel_km smallint not null default 0 check (travel_km between 0 and 200),
  available_days text[] not null default '{}',
  hours_kind text not null check (hours_kind in ('all-day', 'twelve-hour', 'daytime', 'custom')),
  available_from text,
  available_to text,
  identity_document_path text not null,
  terms_accepted boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One mechanic can have multiple applications over time (for example after a
-- rejection); the app only shows the most recent one, so no uniqueness
-- constraint is needed on mechanic_id.

drop trigger if exists mechanic_applications_set_updated_at on public.mechanic_applications;
create trigger mechanic_applications_set_updated_at
  before update on public.mechanic_applications
  for each row execute procedure public.set_updated_at();

-- Clients cannot set their own owner or status: the database always
-- overwrites both on insert.
create or replace function public.mechanic_applications_force_insert_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.mechanic_id := auth.uid();
  new.status := 'pending';
  return new;
end;
$$;

drop trigger if exists mechanic_applications_force_insert_defaults on public.mechanic_applications;
create trigger mechanic_applications_force_insert_defaults
  before insert on public.mechanic_applications
  for each row execute procedure public.mechanic_applications_force_insert_defaults();

alter table public.mechanic_applications enable row level security;

drop policy if exists mechanic_applications_select_own on public.mechanic_applications;
create policy mechanic_applications_select_own
  on public.mechanic_applications
  for select
  to authenticated
  using (mechanic_id = auth.uid());

drop policy if exists mechanic_applications_insert_own on public.mechanic_applications;
create policy mechanic_applications_insert_own
  on public.mechanic_applications
  for insert
  to authenticated
  with check (mechanic_id = auth.uid());

-- No update/delete policy: once submitted, a mechanic cannot edit or remove
-- an application from the client. Only a future admin role will do that.

grant usage on schema public to authenticated;
grant select, insert on public.mechanic_applications to authenticated;

-- Private bucket for mechanic identity documents and profile photos.
-- Objects are stored at "<mechanic_id>/<kind>-<timestamp>.<ext>" and RLS
-- restricts each mechanic to their own folder.
insert into storage.buckets (id, name, public)
values ('mechanic-documents', 'mechanic-documents', false)
on conflict (id) do nothing;

drop policy if exists mechanic_documents_select_own on storage.objects;
create policy mechanic_documents_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'mechanic-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists mechanic_documents_insert_own on storage.objects;
create policy mechanic_documents_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'mechanic-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

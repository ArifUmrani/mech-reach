-- Apply with: npx supabase db push
-- Adds a minimal admin role so a trusted operator can review and
-- approve/reject mechanic applications. Angular uses only the publishable
-- key; RLS is still the only access control.
--
-- Admin membership is intentionally NOT a column on `public.profiles`.
-- `profiles_update_own` (see 20260830120000_profiles_and_jobs.sql) lets any
-- authenticated user update their own profile row with no column
-- restriction, so an `is_admin` boolean there would let a regular user
-- grant themselves admin access (e.g. `update profiles set is_admin = true
-- where id = auth.uid()`). Staff membership instead lives in its own table
-- with zero client grants, so there is no write path to it at all from the
-- publishable-key client.

-- Admin membership. No policies are defined for anon/authenticated, and
-- their table privileges are explicitly revoked below, so every
-- select/insert/update/delete from a regular client is denied - the only
-- way to read this table is through `public.is_admin()` (security
-- definer, below), and the only way to write it is as the table owner or
-- service_role (e.g. from the SQL editor). There is no admin signup flow;
-- staff are added/removed by an operator:
--   insert into public.staff_members (user_id) values ('<auth.users.id>');
create table if not exists public.staff_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.staff_members enable row level security;

-- Defense in depth: RLS with zero policies already denies anon/authenticated
-- entirely, but revoke their table privileges too so a future accidental
-- `grant ... to authenticated` (or RLS being disabled) doesn't reopen this
-- table on its own.
revoke all on public.staff_members from anon, authenticated;

-- Whether the caller is a staff/admin user. `stable` (same result for the
-- same auth.uid() within one statement) and `security definer` so it can
-- read `staff_members` even though callers have zero grants on that table,
-- with a fixed `search_path` so `public.staff_members` and `auth.uid()`
-- always resolve to the real objects and never to a same-named object
-- earlier in some caller's own search_path.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_members s where s.user_id = auth.uid()
  );
$$;

-- Supabase's `postgres` default privileges grant EXECUTE on new functions
-- directly to anon, authenticated, and service_role. Revoking from PUBLIC
-- alone does not remove those direct grants, so clear every auto-granted
-- client role before granting only the intended caller.
revoke all on function public.is_admin()
  from public, anon, authenticated, service_role;
grant execute on function public.is_admin() to authenticated;

-- Admins can see every mechanic's profile (needed to show a contact number
-- alongside an application); mechanics and customers still only see their
-- own row via the existing profiles_select_own policy.
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

-- Admins can see every application, not just their own.
drop policy if exists mechanic_applications_select_admin on public.mechanic_applications;
create policy mechanic_applications_select_admin
  on public.mechanic_applications
  for select
  to authenticated
  using (public.is_admin());

-- Admins can update an application (to approve/reject it). There is still
-- no update policy for regular mechanics at all (see
-- 20260910120000_mechanic_applications.sql), so this is the only path to an
-- update, and it requires public.is_admin() on both the existing row and
-- the new row. The trigger below forces every column except status back to
-- its prior value, and status is limited to 'pending'/'approved'/'rejected'
-- by the table's existing check constraint, so this policy cannot be used
-- to edit application content or set an invalid status.
drop policy if exists mechanic_applications_update_admin on public.mechanic_applications;
create policy mechanic_applications_update_admin
  on public.mechanic_applications
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant update on public.mechanic_applications to authenticated;

create or replace function public.mechanic_applications_force_update_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Only status (and updated_at, via the existing trigger) may change on
  -- update. Every other field stays exactly as the mechanic submitted it.
  new.mechanic_id := old.mechanic_id;
  new.full_name := old.full_name;
  new.email := old.email;
  new.photo_path := old.photo_path;
  new.practice_kind := old.practice_kind;
  new.workshop_name := old.workshop_name;
  new.years_experience := old.years_experience;
  new.vehicle_kind := old.vehicle_kind;
  new.service_ids := old.service_ids;
  new.other_services := old.other_services;
  new.coverage_kind := old.coverage_kind;
  new.city := old.city;
  new.service_areas := old.service_areas;
  new.travel_km := old.travel_km;
  new.available_days := old.available_days;
  new.hours_kind := old.hours_kind;
  new.available_from := old.available_from;
  new.available_to := old.available_to;
  new.identity_document_path := old.identity_document_path;
  new.terms_accepted := old.terms_accepted;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists mechanic_applications_force_update_defaults on public.mechanic_applications;
create trigger mechanic_applications_force_update_defaults
  before update on public.mechanic_applications
  for each row execute procedure public.mechanic_applications_force_update_defaults();

-- Admins can read any mechanic's uploaded documents (identity document and
-- profile photo) to review an application. Mechanics keep their own
-- folder-scoped select/insert policies from the previous migration.
drop policy if exists mechanic_documents_select_admin on storage.objects;
create policy mechanic_documents_select_admin
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'mechanic-documents'
    and public.is_admin()
  );

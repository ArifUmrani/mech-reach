-- Run with: supabase test db
-- Proves the admin-authorization design in 20260911190000_admin_mechanic_review.sql
-- resists privilege escalation. Everything runs inside one transaction that
-- is rolled back at the end, so this never leaves data behind.
begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

-- ---------------------------------------------------------------------
-- Fixtures: two mechanics (alice, bob) and one admin (carol). Inserting
-- into auth.users fires the real `on_auth_user_created` trigger, which
-- creates a matching `public.profiles` row automatically - exactly what
-- happens in production.
-- ---------------------------------------------------------------------
insert into auth.users (id, phone)
values
  ('11111111-1111-1111-1111-111111111111', '+920000000001'),
  ('22222222-2222-2222-2222-222222222222', '+920000000002'),
  ('33333333-3333-3333-3333-333333333333', '+920000000003');

-- Admin membership is granted the only way it can be: directly, as the
-- table owner. Alice and Bob are deliberately left out.
insert into public.staff_members (user_id)
values ('33333333-3333-3333-3333-333333333333');

-- Seed one application per mechanic through the real insert path (as that
-- mechanic), so the existing force_insert_defaults trigger and insert_own
-- policy behave exactly as they would in production.
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.mechanic_applications (
  mechanic_id, full_name, email, practice_kind, vehicle_kind, coverage_kind,
  city, hours_kind, identity_document_path, terms_accepted
) values (
  '11111111-1111-1111-1111-111111111111', 'Alice Mechanic', 'alice@example.test',
  'independent', 'car', 'roadside', 'Lahore', 'all-day',
  '11111111-1111-1111-1111-111111111111/identity.jpg', true
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
insert into public.mechanic_applications (
  mechanic_id, full_name, email, practice_kind, vehicle_kind, coverage_kind,
  city, hours_kind, identity_document_path, terms_accepted
) values (
  '22222222-2222-2222-2222-222222222222', 'Bob Mechanic', 'bob@example.test',
  'independent', 'car', 'roadside', 'Lahore', 'all-day',
  '22222222-2222-2222-2222-222222222222/identity.jpg', true
);
reset role;

-- One uploaded "identity document" per mechanic.
insert into storage.objects (bucket_id, name)
values
  ('mechanic-documents', '11111111-1111-1111-1111-111111111111/identity.jpg'),
  ('mechanic-documents', '22222222-2222-2222-2222-222222222222/identity.jpg');

-- ---------------------------------------------------------------------
-- Structural sanity: staff_members must have RLS enabled.
-- ---------------------------------------------------------------------
select ok(
  (select relrowsecurity from pg_class where oid = 'public.staff_members'::regclass),
  'staff_members has row level security enabled'
);

-- ---------------------------------------------------------------------
-- 1) A normal authenticated user cannot promote themselves to admin.
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is(public.is_admin(), false, 'Alice is not an admin before attempting escalation');

select throws_ok(
  $$ select 1 from public.staff_members $$,
  '42501', null,
  'Alice cannot even select from staff_members'
);
select throws_ok(
  $$ insert into public.staff_members (user_id) values ('11111111-1111-1111-1111-111111111111'::uuid) $$,
  '42501', null,
  'Alice cannot insert herself into staff_members'
);
select throws_ok(
  $$ update public.staff_members set user_id = user_id $$,
  '42501', null,
  'Alice cannot update staff_members'
);
select throws_ok(
  $$ delete from public.staff_members $$,
  '42501', null,
  'Alice cannot delete from staff_members'
);

select is(public.is_admin(), false, 'Alice is still not an admin after the attempted escalation');

-- ---------------------------------------------------------------------
-- 2) A normal authenticated user cannot list other mechanics' applications.
-- ---------------------------------------------------------------------
select is_empty(
  $$ select 1 from public.mechanic_applications where mechanic_id = '22222222-2222-2222-2222-222222222222' $$,
  'Alice cannot see Bobs application row'
);
select results_eq(
  $$ select count(*)::int from public.mechanic_applications $$,
  ARRAY[1],
  'Alice sees exactly one application (her own)'
);

-- ---------------------------------------------------------------------
-- 3) A normal authenticated user cannot change another application (or
--    even their own - only admins may update status at all).
-- ---------------------------------------------------------------------
select lives_ok(
  $$ update public.mechanic_applications set status = 'approved' where mechanic_id = '22222222-2222-2222-2222-222222222222' $$,
  'Update statement does not error (RLS silently hides the row instead)'
);
select lives_ok(
  $$ update public.mechanic_applications set status = 'approved' where mechanic_id = '11111111-1111-1111-1111-111111111111' $$,
  'Alice updating her own application does not error either, but should not apply'
);

reset role;
select is(
  (select status from public.mechanic_applications where mechanic_id = '22222222-2222-2222-2222-222222222222'),
  'pending',
  'Bobs application status is unchanged after Alices attempted update'
);
select is(
  (select status from public.mechanic_applications where mechanic_id = '11111111-1111-1111-1111-111111111111'),
  'pending',
  'Alices own application status is unchanged - only admins can approve/reject'
);

-- ---------------------------------------------------------------------
-- 4) A normal authenticated user cannot read another mechanic's documents.
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'mechanic-documents' and name = '22222222-2222-2222-2222-222222222222/identity.jpg' $$,
  'Alice cannot see Bobs uploaded document'
);
select isnt_empty(
  $$ select 1 from storage.objects where bucket_id = 'mechanic-documents' and name = '11111111-1111-1111-1111-111111111111/identity.jpg' $$,
  'Alice can still see her own uploaded document'
);

-- ---------------------------------------------------------------------
-- 5) profiles: an admin can be looked up by mechanic_id join, but a
--    regular user cannot read another user's profile this way either.
-- ---------------------------------------------------------------------
select is_empty(
  $$ select 1 from public.profiles where id = '22222222-2222-2222-2222-222222222222' $$,
  'Alice cannot read Bobs profile row'
);

-- ---------------------------------------------------------------------
-- 6) is_admin() itself is not callable by anon (no EXECUTE grant), so an
--    unauthenticated client cannot even probe admin status.
-- ---------------------------------------------------------------------
set local role anon;
select throws_ok(
  $$ select public.is_admin() $$,
  '42501', null,
  'anon has no execute grant on is_admin()'
);

-- ---------------------------------------------------------------------
-- 7) Positive path: the real admin (carol) can do everything the app
--    needs. This proves the policies above are not accidentally blocking
--    admins too.
-- ---------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is(public.is_admin(), true, 'Carol (staff_members member) is recognized as admin');
select results_eq(
  $$ select count(*)::int from public.mechanic_applications $$,
  ARRAY[2],
  'Admin sees both applications'
);
select isnt_empty(
  $$ select 1 from public.profiles where id = '22222222-2222-2222-2222-222222222222' $$,
  'Admin can read Bobs profile row (needed to show a contact number)'
);
select lives_ok(
  $$ update public.mechanic_applications set status = 'approved' where mechanic_id = '22222222-2222-2222-2222-222222222222' $$,
  'Admin can update Bobs application'
);
select isnt_empty(
  $$ select 1 from storage.objects where bucket_id = 'mechanic-documents' and name = '22222222-2222-2222-2222-222222222222/identity.jpg' $$,
  'Admin can see Bobs uploaded document'
);

reset role;
select is(
  (select status from public.mechanic_applications where mechanic_id = '22222222-2222-2222-2222-222222222222'),
  'approved',
  'Bobs application really was approved by the admin update above'
);

-- ---------------------------------------------------------------------
-- 8) The status check constraint applies to everyone, including admins -
--    only pending/approved/rejected are ever valid.
-- ---------------------------------------------------------------------
select throws_ok(
  $$ update public.mechanic_applications set status = 'archived' where mechanic_id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null,
  'status is limited to pending/approved/rejected by the check constraint'
);

select * from finish();
rollback;

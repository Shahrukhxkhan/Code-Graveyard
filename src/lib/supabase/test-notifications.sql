-- ============================================================================
-- SQL VERIFICATION TEST SUITE: NOTIFICATION TRIGGERS & RLS
-- ============================================================================

begin;

-- 1. Create dummy users
insert into public.users (id, username, full_name)
values 
  ('11111111-1111-1111-1111-111111111111', 'notif_owner', 'Project Owner'),
  ('22222222-2222-2222-2222-222222222222', 'notif_adopter', 'Adopter User')
on conflict (id) do nothing;

-- 2. Create dummy project
insert into public.projects (id, user_id, title, tagline, stage_of_death, primary_reason, is_adoptable)
values (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Test Notif Project',
  'Testing notifications trigger',
  'prototype',
  'lost_interest',
  true
) on conflict (id) do nothing;

-- 3. Test Trigger 1: Insert adoption request -> expect notification for project owner
insert into public.adoptions (id, project_id, adopter_id, message, status)
values (
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'I want to adopt this project!',
  'pending'
);

-- Assert owner received notification
do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.notifications
  where user_id = '11111111-1111-1111-1111-111111111111'
    and type = 'adoption_request'
    and related_adoption_id = '44444444-4444-4444-4444-444444444444';

  if v_count <> 1 then
    raise exception 'FAIL: Expected 1 notification for project owner, got %', v_count;
  end if;
  raise notice 'PASS: Project owner notification trigger verified.';
end $$;

-- 4. Test Trigger 2: Update adoption status to accepted -> expect notification for adopter
update public.adoptions
set status = 'accepted'
where id = '44444444-4444-4444-4444-444444444444';

-- Assert adopter received notification
do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.notifications
  where user_id = '22222222-2222-2222-2222-222222222222'
    and type = 'adoption_status'
    and related_adoption_id = '44444444-4444-4444-4444-444444444444';

  if v_count <> 1 then
    raise exception 'FAIL: Expected 1 notification for adopter, got %', v_count;
  end if;
  raise notice 'PASS: Adopter notification trigger verified.';
end $$;

rollback;

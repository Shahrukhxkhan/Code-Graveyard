-- ============================================================================
-- RLS TEST SUITE FOR `adoptions` AND `saves` TABLES
-- ============================================================================
-- This script tests Row Level Security (RLS) policies for Code-Graveyard.
-- It creates temporary test users and projects within a transaction,
-- impersonates different users via auth.uid(), and asserts RLS behavior.
-- ============================================================================

BEGIN;

-- 1. Create auth schema and auth.uid() helper if not present
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create auth.users table if running in isolated postgres environment
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY,
  email text
);

-- 2. Define test UUIDs
DO $$
DECLARE
  v_user_a uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_user_b uuid := 'b0000000-0000-0000-0000-000000000002'::uuid;
  v_user_c uuid := 'c0000000-0000-0000-0000-000000000003'::uuid;

  v_proj_b uuid := 'b1000000-0000-0000-0000-000000000001'::uuid;
  v_proj_c uuid := 'c1000000-0000-0000-0000-000000000001'::uuid;

  v_save_b uuid := 'b2000000-0000-0000-0000-000000000001'::uuid;
  v_adopt_bc uuid := 'bc000000-0000-0000-0000-000000000001'::uuid;

  v_count integer;
  v_error_caught boolean;
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'STARTING RLS SECURITY AUDIT TEST SUITE';
  RAISE NOTICE '==================================================';

  -- Setup auth.users
  INSERT INTO auth.users (id, email) VALUES
    (v_user_a, 'user_a@example.com'),
    (v_user_b, 'user_b@example.com'),
    (v_user_c, 'user_c@example.com')
  ON CONFLICT (id) DO NOTHING;

  -- Setup public.users
  INSERT INTO public.users (id, username, full_name) VALUES
    (v_user_a, 'user_a', 'User A'),
    (v_user_b, 'user_b', 'User B'),
    (v_user_c, 'user_c', 'User C')
  ON CONFLICT (id) DO NOTHING;

  -- Setup public.projects (User B owns project B, User C owns project C)
  INSERT INTO public.projects (id, user_id, title, tagline, what_it_was, why_abandoned, what_worked, what_failed, lessons_learned, what_id_do_differently, the_moment_i_knew)
  VALUES
    (v_proj_b, v_user_b, 'Project B', 'Tagline B', 'Was B', 'Abandoned B', 'Worked B', 'Failed B', 'Lessons B', 'Differently B', 'Moment B'),
    (v_proj_c, v_user_c, 'Project C', 'Tagline C', 'Was C', 'Abandoned C', 'Worked C', 'Failed C', 'Lessons C', 'Differently C', 'Moment C')
  ON CONFLICT (id) DO NOTHING;

  -- Insert seed save for User B (User B saved Project C)
  INSERT INTO public.saves (id, user_id, project_id)
  VALUES (v_save_b, v_user_b, v_proj_c)
  ON CONFLICT (id) DO NOTHING;

  -- Insert seed adoption: User B requested adoption for Project C (owned by User C)
  INSERT INTO public.adoptions (id, project_id, adopter_id, message, status)
  VALUES (v_adopt_bc, v_proj_c, v_user_b, 'User B wants to adopt Project C', 'pending')
  ON CONFLICT (id) DO NOTHING;

  -- --------------------------------------------------------------------------
  -- TEST 1: User A cannot SELECT User B's saves
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);

  SELECT count(*) INTO v_count FROM public.saves WHERE user_id = v_user_b;
  IF v_count = 0 THEN
    RAISE NOTICE 'PASS [Test 1]: User A cannot SELECT User B''s saves (0 rows returned).';
  ELSE
    RAISE EXCEPTION 'FAIL [Test 1]: User A was able to read User B''s saves!';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 2: User A cannot SELECT an adoption request for a project they don't own and didn't create
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);

  SELECT count(*) INTO v_count FROM public.adoptions WHERE id = v_adopt_bc;
  IF v_count = 0 THEN
    RAISE NOTICE 'PASS [Test 2]: User A cannot SELECT adoption request between User B and User C (0 rows returned).';
  ELSE
    RAISE EXCEPTION 'FAIL [Test 2]: User A was able to read adoption request for Project C!';
  END IF;

  -- Verify User B (adopter) CAN select it
  PERFORM set_config('request.jwt.claim.sub', v_user_b::text, true);
  SELECT count(*) INTO v_count FROM public.adoptions WHERE id = v_adopt_bc;
  IF v_count = 1 THEN
    RAISE NOTICE 'PASS [Test 2b]: User B (adopter) CAN SELECT their own adoption request.';
  ELSE
    RAISE EXCEPTION 'FAIL [Test 2b]: User B could not read their own adoption request!';
  END IF;

  -- Verify User C (project owner) CAN select it
  PERFORM set_config('request.jwt.claim.sub', v_user_c::text, true);
  SELECT count(*) INTO v_count FROM public.adoptions WHERE id = v_adopt_bc;
  IF v_count = 1 THEN
    RAISE NOTICE 'PASS [Test 2c]: User C (project owner) CAN SELECT adoption requests on their project.';
  ELSE
    RAISE EXCEPTION 'FAIL [Test 2c]: User C could not read adoption request for their project!';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 3: User A cannot fabricate an adoption row using User B's id in adopter_id
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  v_error_caught := false;

  BEGIN
    INSERT INTO public.adoptions (project_id, adopter_id, message)
    VALUES (v_proj_b, v_user_b, 'Fabricated request by A using B ID');
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF v_error_caught THEN
    RAISE NOTICE 'PASS [Test 3]: User A cannot fabricate an adoption row setting adopter_id = User B.';
  ELSE
    RAISE EXCEPTION 'FAIL [Test 3]: User A successfully inserted an adoption row with adopter_id = User B!';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 4: User A cannot fabricate an adoption row with status = ''accepted'' (self-approval)
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  v_error_caught := false;

  BEGIN
    INSERT INTO public.adoptions (project_id, adopter_id, message, status)
    VALUES (v_proj_b, v_user_a, 'Attempting self-approved adoption', 'accepted');
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF v_error_caught THEN
    RAISE NOTICE 'PASS [Test 4]: User A cannot insert an adoption row with status = ''accepted''.';
  ELSE
    RAISE EXCEPTION 'FAIL [Test 4]: User A was able to insert an adoption request as pre-accepted!';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 5: User A cannot fabricate a save row using User B's id in user_id
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  v_error_caught := false;

  BEGIN
    INSERT INTO public.saves (user_id, project_id)
    VALUES (v_user_b, v_proj_b);
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;

  IF v_error_caught THEN
    RAISE NOTICE 'PASS [Test 5]: User A cannot insert a save row setting user_id = User B.';
  ELSE
    RAISE EXCEPTION 'FAIL [Test 5]: User A successfully inserted a save row for User B!';
  END IF;

  RAISE NOTICE '==================================================';
  RAISE NOTICE 'ALL RLS TESTS PASSED SUCCESSFULLY!';
  RAISE NOTICE '==================================================';
END $$;

ROLLBACK;

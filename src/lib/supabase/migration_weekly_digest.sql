-- ============================================================================
-- WEEKLY DIGEST EMAIL OPT-IN MIGRATION
-- ============================================================================

-- Add digest_opted_in column to public.users table
alter table public.users
  add column if not exists digest_opted_in boolean default true;

-- Partial index for fast querying of opted-in users
create index if not exists idx_users_digest_opted_in
  on public.users (digest_opted_in)
  where digest_opted_in = true;

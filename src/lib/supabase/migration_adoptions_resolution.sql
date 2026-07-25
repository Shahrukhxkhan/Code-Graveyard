-- ============================================================================
-- ADOPTION DISPUTE HANDLING & MULTI-ADOPTER RESOLUTION MIGRATION
-- ============================================================================

-- 1. UPDATE ADOPTION_STATUS ENUM TYPES / CHECK CONSTRAINTS
-- Postgres enum alteration to include 'completed', 'abandoned_by_adopter', and 'superseded'
do $$
begin
  if exists (select 1 from pg_type where typname = 'adoption_status') then
    alter type adoption_status add value if not exists 'completed';
    alter type adoption_status add value if not exists 'abandoned_by_adopter';
    alter type adoption_status add value if not exists 'superseded';
  end if;
end $$;

-- 2. ADD RESPONDED_BY_DEADLINE COLUMN TO ADOPTIONS
alter table public.adoptions
  add column if not exists responded_by_deadline timestamptz;

-- Index for expiration check performance
create index if not exists idx_adoptions_deadline
  on public.adoptions (responded_by_deadline)
  where status = 'accepted';

create index if not exists idx_adoptions_project_status
  on public.adoptions (project_id, status);

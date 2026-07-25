-- ============================================================================
-- AI-GENERATED PROJECT SUMMARIES MIGRATION
-- ============================================================================

-- Add summary and summary_generated_at columns to projects table
alter table public.projects
  add column if not exists summary text,
  add column if not exists summary_generated_at timestamptz;

-- Index for summary timestamp lookups
create index if not exists idx_projects_summary_generated_at
  on public.projects (summary_generated_at)
  where summary_generated_at is not null;

-- ============================================================================
-- PGVECTOR SEMANTIC SEARCH MIGRATION
-- ============================================================================

-- 1. ENABLE PGVECTOR EXTENSION
create extension if not exists vector;

-- 2. ADD EMBEDDING COLUMN TO PROJECTS TABLE (1536-dimensional vector for OpenAI text-embedding-3-small)
alter table public.projects
  add column if not exists embedding vector(1536);

-- 3. CREATE HNSW COSINE SIMILARITY INDEX FOR FAST NEAREST-NEIGHBOR SEARCH
create index if not exists idx_projects_embedding_hnsw
  on public.projects using hnsw (embedding vector_cosine_ops);

-- 4. PRE-FILTERED VECTOR SIMILARITY SEARCH RPC FUNCTION
create or replace function match_projects_semantic(
  query_embedding vector(1536),
  match_threshold float default 0.0,
  match_count int default 20,
  filter_stage text default 'all',
  filter_reason text default 'all',
  filter_adoptable boolean default false
)
returns table (
  id uuid,
  title text,
  tagline text,
  what_it_was text,
  why_abandoned text,
  what_worked text,
  what_failed text,
  lessons_learned text,
  what_id_do_differently text,
  the_moment_i_knew text,
  stage_of_death project_stage,
  primary_reason abandonment_reason,
  time_invested_hours integer,
  date_started date,
  date_abandoned date,
  github_url text,
  demo_url text,
  is_adoptable boolean,
  is_anonymous boolean,
  is_hidden boolean,
  summary text,
  summary_generated_at timestamptz,
  view_count integer,
  created_at timestamptz,
  user_id uuid,
  similarity float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    p.id,
    p.title,
    p.tagline,
    p.what_it_was,
    p.why_abandoned,
    p.what_worked,
    p.what_failed,
    p.lessons_learned,
    p.what_id_do_differently,
    p.the_moment_i_knew,
    p.stage_of_death,
    p.primary_reason,
    p.time_invested_hours,
    p.date_started,
    p.date_abandoned,
    p.github_url,
    p.demo_url,
    p.is_adoptable,
    p.is_anonymous,
    p.is_hidden,
    p.summary,
    p.summary_generated_at,
    p.view_count,
    p.created_at,
    p.user_id,
    (1 - (p.embedding <=> query_embedding))::float as similarity
  from public.projects p
  where coalesce(p.is_hidden, false) = false
    and p.embedding is not null
    and (filter_stage = 'all' or p.stage_of_death::text = filter_stage)
    and (filter_reason = 'all' or p.primary_reason::text = filter_reason)
    and (not filter_adoptable or p.is_adoptable = true)
    and (1 - (p.embedding <=> query_embedding)) >= match_threshold
  order by p.embedding <=> query_embedding
  limit match_count;
end;
$$;

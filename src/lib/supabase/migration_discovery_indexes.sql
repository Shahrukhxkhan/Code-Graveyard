-- ============================================================================
-- MIGRATION: DISCOVERY & FILTERING PERFORMANCE INDEXES
-- ============================================================================
-- Optimizes filtered project queries on / against scale (10k+ rows).
-- ============================================================================

-- 1. Enable pg_trgm extension for fast ILIKE substring searches
create extension if not exists pg_trgm;

-- 2. Trigram GIN indexes for fast free-text search on title and tagline
create index if not exists idx_projects_title_trgm
  on public.projects using gin (title gin_trgm_ops);

create index if not exists idx_projects_tagline_trgm
  on public.projects using gin (tagline gin_trgm_ops);

-- 3. Composite covering indexes for tag-based filtering (both directions)
create index if not exists idx_project_tags_project_tag
  on public.project_tags (project_id, tag_id);

create index if not exists idx_project_tags_tag_project
  on public.project_tags (tag_id, project_id);

-- 4. B-Tree indexes for default sort and multi-column filtering
create index if not exists idx_projects_created_at
  on public.projects (created_at desc);

create index if not exists idx_projects_discovery_composite
  on public.projects (stage_of_death, primary_reason, is_adoptable, created_at desc);

-- 5. Index on project views deduplication table
create index if not exists idx_project_views_lookup
  on public.project_views (project_id, viewer_fingerprint);

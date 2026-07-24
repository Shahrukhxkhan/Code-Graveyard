-- ============================================================================
-- EXPLAIN ANALYZE BENCHMARK FOR DISCOVERY FILTERS
-- ============================================================================

-- 1. Worst-case combined filter query on homepage
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  id, title, tagline, stage_of_death, primary_reason, 
  time_invested_hours, date_abandoned, is_adoptable, is_anonymous, 
  view_count, created_at, user_id
FROM public.projects
WHERE (title ILIKE '%saas%' OR tagline ILIKE '%saas%')
  AND stage_of_death = 'prototype'
  AND primary_reason = 'lost_interest'
  AND is_adoptable = true
ORDER BY created_at DESC
LIMIT 12 OFFSET 0;

-- 2. Tag-based join query (filtering projects by tag)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT p.id, p.title, p.tagline, p.created_at
FROM public.projects p
JOIN public.project_tags pt ON pt.project_id = p.id
JOIN public.tags t ON t.id = pt.tag_id
WHERE t.name = 'TypeScript'
ORDER BY p.created_at DESC
LIMIT 12 OFFSET 0;

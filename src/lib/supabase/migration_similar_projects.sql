-- ============================================================================
-- SIMILAR PROJECTS RECOMMENDATION RPC MIGRATION
-- ============================================================================

create or replace function get_similar_projects(
  target_project_id uuid,
  match_limit int default 4
)
returns table (
  id uuid,
  title text,
  tagline text,
  stage_of_death project_stage,
  primary_reason abandonment_reason,
  summary text,
  time_invested_hours integer,
  date_abandoned date,
  is_adoptable boolean,
  is_anonymous boolean,
  user_id uuid,
  shared_tag_names text[],
  combined_score float
)
language plpgsql
security definer
as $$
begin
  return query
  with tag_counts as (
    select tag_id, count(*)::float as cnt
    from public.project_tags
    group by tag_id
  ),
  target_tags as (
    select tag_id
    from public.project_tags
    where project_id = target_project_id
  ),
  target_project as (
    select id, stage_of_death, primary_reason, embedding
    from public.projects
    where id = target_project_id
  ),
  candidate_tag_scores as (
    select
      pt.project_id,
      sum(1.0 / (log(2, tc.cnt + 1.0) + 0.1)) as tag_score,
      count(distinct pt.tag_id) as shared_tag_count,
      array_agg(t.name) as shared_tag_names
    from public.project_tags pt
    join target_tags tt on pt.tag_id = tt.tag_id
    join tag_counts tc on pt.tag_id = tc.tag_id
    join public.tags t on pt.tag_id = t.id
    where pt.project_id <> target_project_id
    group by pt.project_id
  ),
  candidate_scores as (
    select
      p.id as project_id,
      coalesce(cts.tag_score, 0.0) as tag_score,
      coalesce(cts.shared_tag_count, 0) as shared_tag_count,
      coalesce(cts.shared_tag_names, array[]::text[]) as shared_tag_names,
      case
        when tp.embedding is not null and p.embedding is not null then
          (1.0 - (p.embedding <=> tp.embedding))
        else null
      end as embedding_similarity,
      (case when p.stage_of_death = tp.stage_of_death then 0.5 else 0.0 end) +
      (case when p.primary_reason = tp.primary_reason then 0.5 else 0.0 end) as fallback_score
    from public.projects p
    cross join target_project tp
    left join candidate_tag_scores cts on p.id = cts.project_id
    where p.id <> target_project_id
      and coalesce(p.is_hidden, false) = false
  ),
  ranked_candidates as (
    select
      cs.*,
      case
        when cs.embedding_similarity is not null then
          ((0.4 * cs.tag_score) + (0.6 * cs.embedding_similarity) + (0.1 * cs.fallback_score))::float
        else
          (cs.tag_score + (0.2 * cs.fallback_score))::float
      end as combined_score
    from candidate_scores cs
    where cs.tag_score > 0 or cs.embedding_similarity is not null or cs.fallback_score > 0
  )
  select
    p.id,
    p.title,
    p.tagline,
    p.stage_of_death,
    p.primary_reason,
    p.summary,
    p.time_invested_hours,
    p.date_abandoned,
    p.is_adoptable,
    p.is_anonymous,
    p.user_id,
    rc.shared_tag_names,
    rc.combined_score
  from ranked_candidates rc
  join public.projects p on rc.project_id = p.id
  order by rc.combined_score desc, p.created_at desc
  limit match_limit;
end;
$$;

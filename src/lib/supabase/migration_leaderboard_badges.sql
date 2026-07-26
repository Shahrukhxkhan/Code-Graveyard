-- ============================================================================
-- MIGRATION: LEADERBOARD STATS VIEW & PROFILE BADGES SYSTEM
-- ============================================================================

-- 1. Create LEADERBOARD_STATS View
create or replace view public.leaderboard_stats as
select
  u.id as user_id,
  u.username,
  u.full_name,
  u.avatar_url,
  
  -- Total non-hidden projects buried
  coalesce(p_counts.total_projects_buried, 0)::int as total_projects_buried,
  
  -- Total views received across user projects
  coalesce(p_counts.total_views_received, 0)::int as total_views_received,
  
  -- Total non-hidden snippets salvaged
  coalesce(s_counts.total_snippets_salvaged, 0)::int as total_snippets_salvaged,
  
  -- Adoptions completed as project owner
  coalesce(a_owner_counts.completed_as_owner, 0)::int as total_adoptions_completed_as_owner,
  
  -- Adoptions completed as adopter
  coalesce(a_adopter_counts.completed_as_adopter, 0)::int as total_adoptions_completed_as_adopter,
  
  -- Combined completed adoptions
  (coalesce(a_owner_counts.completed_as_owner, 0) + coalesce(a_adopter_counts.completed_as_adopter, 0))::int as total_adoptions_completed

from public.users u

left join (
  select user_id, count(*) as total_projects_buried, coalesce(sum(view_count), 0) as total_views_received
  from public.projects
  where is_hidden = false
  group by user_id
) p_counts on u.id = p_counts.user_id

left join (
  select user_id, count(*) as total_snippets_salvaged
  from public.snippets
  where is_hidden = false
  group by user_id
) s_counts on u.id = s_counts.user_id

left join (
  select p.user_id, count(*) as completed_as_owner
  from public.adoptions a
  join public.projects p on a.project_id = p.id
  where a.status = 'completed'
  group by p.user_id
) a_owner_counts on u.id = a_owner_counts.user_id

left join (
  select adopter_id, count(*) as completed_as_adopter
  from public.adoptions
  where status = 'completed'
  group by adopter_id
) a_adopter_counts on u.id = a_adopter_counts.adopter_id;

-- 2. Create USER_BADGES Table
create table if not exists public.user_badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  badge_key text not null,
  earned_at timestamptz default now(),
  constraint user_badge_unique unique (user_id, badge_key)
);

alter table public.user_badges enable row level security;

create policy "User badges are publicly readable"
  on public.user_badges for select
  using (true);

create policy "System and service role can manage badges"
  on public.user_badges for all
  using (true);

-- 3. Create WEEKLY_LEADERBOARD_SNAPSHOTS Table
create table if not exists public.weekly_leaderboard_snapshots (
  id uuid default gen_random_uuid() primary key,
  snapshot_date date default current_date,
  user_id uuid references public.users(id) on delete cascade not null,
  category text not null, -- 'most_adopted', 'most_salvaged', 'most_buried', 'most_viewed'
  rank integer not null,
  stat_value integer not null,
  created_at timestamptz default now(),
  constraint snapshot_unique unique (snapshot_date, category, user_id)
);

alter table public.weekly_leaderboard_snapshots enable row level security;

create policy "Snapshots are publicly readable"
  on public.weekly_leaderboard_snapshots for select
  using (true);

-- 4. Create Scheduled Evaluation Function
create or replace function evaluate_user_badges()
returns void as $$
declare
  rec record;
begin
  for rec in select * from public.leaderboard_stats loop
    -- 1. "gravedigger": 10+ projects buried
    if rec.total_projects_buried >= 10 then
      insert into public.user_badges (user_id, badge_key)
      values (rec.user_id, 'gravedigger')
      on conflict (user_id, badge_key) do nothing;
    end if;

    -- 2. "necromancer": 5+ adoptions completed as owner
    if rec.total_adoptions_completed_as_owner >= 5 then
      insert into public.user_badges (user_id, badge_key)
      values (rec.user_id, 'necromancer')
      on conflict (user_id, badge_key) do nothing;
    end if;

    -- 3. "salvager": 20+ snippets posted
    if rec.total_snippets_salvaged >= 20 then
      insert into public.user_badges (user_id, badge_key)
      values (rec.user_id, 'salvager')
      on conflict (user_id, badge_key) do nothing;
    end if;
  end loop;

  -- 4. "community_pillar": Top 10 rank in any category for 4+ consecutive weekly snapshots
  insert into public.user_badges (user_id, badge_key)
  select distinct user_id, 'community_pillar'
  from (
    select user_id, category, count(distinct snapshot_date) as top10_weeks
    from public.weekly_leaderboard_snapshots
    where rank <= 10
    group by user_id, category
    having count(distinct snapshot_date) >= 4
  ) pillars
  on conflict (user_id, badge_key) do nothing;

end;
$$ language plpgsql security definer;

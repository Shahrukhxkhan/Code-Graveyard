create extension if not exists "pgcrypto";

-- USERS TABLE
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  github_username text,
  website_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ENUMS
create type project_stage as enum (
  'idea',
  'prototype',
  'mvp',
  'launched',
  'unknown'
);

create type abandonment_reason as enum (
  'lost_interest',
  'technical_debt',
  'scope_creep',
  'no_time',
  'market_timing',
  'team_issues',
  'financial',
  'technical_blocker',
  'pivoted',
  'other'
);

create type adoption_status as enum (
  'pending',
  'accepted',
  'rejected',
  'abandoned',
  'completed',
  'abandoned_by_adopter',
  'superseded'
);

-- PROJECTS TABLE (the "graves")
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,

  -- Basic info
  title text not null,
  tagline text not null,

  -- Post mortem fields (ALL required)
  what_it_was text not null,
  why_abandoned text not null,
  what_worked text not null,
  what_failed text not null,
  lessons_learned text not null,
  what_id_do_differently text not null,
  the_moment_i_knew text not null,

  -- Metadata
  stage_of_death project_stage default 'unknown',
  primary_reason abandonment_reason default 'other',
  time_invested_hours integer,
  date_started date,
  date_abandoned date,

  -- Links
  github_url text,
  demo_url text,

  -- Settings
  is_adoptable boolean default true,
  is_anonymous boolean default false,
  view_count integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TAGS TABLE
create table public.tags (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  category text not null,
  -- categories: 'technology', 'failure_reason', 'domain'
  color text
);

-- PROJECT TAGS (junction)
create table public.project_tags (
  project_id uuid references public.projects(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (project_id, tag_id)
);

-- SNIPPETS TABLE
create table public.snippets (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,

  title text not null,
  description text not null,
  code text not null,
  language text not null,
  is_standalone boolean default false,
  save_count integer default 0,

  created_at timestamptz default now()
);

-- ADOPTIONS TABLE
create table public.adoptions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  adopter_id uuid references public.users(id) on delete cascade not null,

  message text not null,
  status adoption_status default 'pending',
  responded_by_deadline timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SAVES TABLE (bookmarks for projects and snippets)
create table public.saves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade,
  snippet_id uuid references public.snippets(id) on delete cascade,
  created_at timestamptz default now(),
  -- must save either a project or snippet, not neither
  constraint saves_must_have_target
    check (project_id is not null or snippet_id is not null)
);

-- SEED INITIAL TAGS
insert into public.tags (name, category, color) values
  -- Technologies
  ('React', 'technology', '#61DAFB'),
  ('Next.js', 'technology', '#000000'),
  ('Node.js', 'technology', '#339933'),
  ('Python', 'technology', '#3776AB'),
  ('TypeScript', 'technology', '#3178C6'),
  ('Vue', 'technology', '#4FC08D'),
  ('PostgreSQL', 'technology', '#336791'),
  ('MongoDB', 'technology', '#47A248'),
  ('React Native', 'technology', '#61DAFB'),
  ('Swift', 'technology', '#FA7343'),
  ('Rust', 'technology', '#000000'),
  ('Go', 'technology', '#00ADD8'),
  -- Domains
  ('SaaS', 'domain', '#6366F1'),
  ('Mobile App', 'domain', '#8B5CF6'),
  ('CLI Tool', 'domain', '#10B981'),
  ('API', 'domain', '#F59E0B'),
  ('Browser Extension', 'domain', '#EF4444'),
  ('Game', 'domain', '#EC4899'),
  ('Developer Tool', 'domain', '#14B8A6'),
  ('E-commerce', 'domain', '#F97316'),
  ('Social Platform', 'domain', '#3B82F6'),
  ('AI/ML', 'domain', '#8B5CF6');

-- ROW LEVEL SECURITY
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.snippets enable row level security;
alter table public.adoptions enable row level security;
alter table public.saves enable row level security;
alter table public.tags enable row level security;
alter table public.project_tags enable row level security;

-- Users policies
create policy "Users can view all profiles"
  on public.users for select using (true);
create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- Projects policies
create policy "Anyone can view projects"
  on public.projects for select using (true);
create policy "Authenticated users can insert projects"
  on public.projects for insert
  with check (auth.uid() = user_id);
create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);
create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Snippets policies
create policy "Anyone can view snippets"
  on public.snippets for select using (true);
create policy "Authenticated users can insert snippets"
  on public.snippets for insert
  with check (auth.uid() = user_id);
create policy "Users can update own snippets"
  on public.snippets for update
  using (auth.uid() = user_id);

-- Adoptions policies
create policy "Users can view adoptions for their projects"
  on public.adoptions for select
  using (
    auth.uid() = adopter_id or
    exists (
      select 1 from public.projects
      where id = adoptions.project_id and user_id = auth.uid()
    )
  );

create policy "Authenticated users can create adoptions"
  on public.adoptions for insert
  with check (
    auth.uid() = adopter_id and
    (status is null or status = 'pending'::adoption_status) and
    not exists (
      select 1 from public.projects
      where id = adoptions.project_id and user_id = auth.uid()
    )
  );

create policy "Project owner can update adoption status"
  on public.adoptions for update
  using (
    exists (
      select 1 from public.projects
      where id = adoptions.project_id and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where id = adoptions.project_id and user_id = auth.uid()
    )
  );

create policy "Adopter or project owner can delete adoptions"
  on public.adoptions for delete
  using (
    auth.uid() = adopter_id or
    exists (
      select 1 from public.projects
      where id = adoptions.project_id and user_id = auth.uid()
    )
  );

-- Saves policies (Explicit SELECT, INSERT, DELETE; UPDATE defaults to DENY)
create policy "Users can view own saves"
  on public.saves for select
  using (auth.uid() = user_id);

create policy "Users can insert own saves"
  on public.saves for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saves"
  on public.saves for delete
  using (auth.uid() = user_id);

-- Tags policies (public read)
create policy "Anyone can view tags"
  on public.tags for select using (true);
create policy "Anyone can view project tags"
  on public.project_tags for select using (true);
create policy "Users can tag own projects"
  on public.project_tags for insert
  with check (
    auth.uid() = (
      select user_id from public.projects
      where id = project_id
    )
  );

-- FUNCTIONS & TRIGGERS

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_users_updated_at
  before update on public.users
  for each row execute function update_updated_at();

create trigger update_projects_updated_at
  before update on public.projects
  for each row execute function update_updated_at();

-- Auto-create user profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, full_name, avatar_url, github_username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'preferred_username',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    new.raw_user_meta_data->>'user_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- PROJECT VIEWS DEDUPLICATION TABLE
create table if not exists public.project_views (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  viewer_fingerprint text not null,
  viewed_at timestamptz default now()
);

-- Unique index to prevent duplicate view increments per (project, viewer, date)
create unique index if not exists idx_project_views_dedup
  on public.project_views (project_id, viewer_fingerprint, ((viewed_at at time zone 'UTC')::date));

alter table public.project_views enable row level security;

-- ANTI-INFLATION INCREMENT VIEW COUNT RPC
-- Uses insert-or-ignore on public.project_views to ensure a viewer (auth.uid() or session fingerprint)
-- can only increment a project's view_count once per calendar day.
create or replace function increment_view_count(
  project_id uuid,
  viewer_fingerprint text default null
)
returns boolean as $$
declare
  v_fingerprint text;
begin
  -- Resolve viewer fingerprint: explicit parameter > auth.uid() > default fallback
  v_fingerprint := coalesce(
    nullif(trim(viewer_fingerprint), ''),
    auth.uid()::text,
    'anonymous-session'
  );

  -- Atomic insert-or-ignore into deduplication table
  insert into public.project_views (project_id, viewer_fingerprint, viewed_at)
  values (project_id, v_fingerprint, now())
  on conflict (project_id, viewer_fingerprint, ((viewed_at at time zone 'UTC')::date))
  do nothing;

  -- Only increment view_count if this view is new today
  if found then
    update public.projects
    set view_count = coalesce(view_count, 0) + 1
    where id = project_id;
    return true;
  end if;

  return false;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- DISCOVERY & FILTERING PERFORMANCE INDEXES
-- ============================================================================
create extension if not exists pg_trgm;

create index if not exists idx_projects_title_trgm
  on public.projects using gin (title gin_trgm_ops);

create index if not exists idx_projects_tagline_trgm
  on public.projects using gin (tagline gin_trgm_ops);

create index if not exists idx_project_tags_project_tag
  on public.project_tags (project_id, tag_id);

create index if not exists idx_project_tags_tag_project
  on public.project_tags (tag_id, project_id);

create index if not exists idx_projects_created_at
  on public.projects (created_at desc);

create index if not exists idx_projects_discovery_composite
  on public.projects (stage_of_death, primary_reason, is_adoptable, created_at desc);

-- ============================================================================
-- NOTIFICATIONS SYSTEM & EMAIL DISPATCHER
-- ============================================================================

alter table public.users
  add column if not exists email_notifications_enabled boolean default true;

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text not null,
  related_project_id uuid references public.projects(id) on delete cascade,
  related_adoption_id uuid references public.adoptions(id) on delete cascade,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "System and trigger insert notifications"
  on public.notifications for insert
  with check (true);

-- Email Dispatcher Function (Fluggable & Fail-Safe)
create or replace function dispatch_email_notification(
  p_user_id uuid,
  p_subject text,
  p_body text
) returns void as $$
declare
  v_email_enabled boolean;
  v_user_email text;
  v_app_url text := coalesce(current_setting('app.settings.site_url', true), 'http://localhost:3000');
  v_smtp_flag text := coalesce(current_setting('app.settings.enable_email', true), 'false');
begin
  select coalesce(email_notifications_enabled, true) into v_email_enabled
  from public.users where id = p_user_id;

  if not v_email_enabled or v_smtp_flag != 'true' then
    return;
  end if;

  begin
    select email into v_user_email from auth.users where id = p_user_id;
  exception when others then
    v_user_email := null;
  end;

  if v_user_email is null then
    return;
  end if;

  begin
    perform net.http_post(
      url := v_app_url || '/api/notifications/email',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'to', v_user_email,
        'subject', p_subject,
        'body', p_body
      )
    );
  exception when others then
    null;
  end;
end;
$$ language plpgsql security definer;

-- Trigger Function 1: Notify Project Owner on New Adoption Request
create or replace function notify_owner_on_adoption_insert()
returns trigger as $$
declare
  v_owner_id uuid;
  v_project_title text;
begin
  select user_id, title into v_owner_id, v_project_title
  from public.projects
  where id = NEW.project_id;

  if v_owner_id is not null then
    insert into public.notifications (
      user_id, type, title, body, related_project_id, related_adoption_id
    ) values (
      v_owner_id, 'adoption_request', 'New Adoption Request',
      'A developer requested to adopt "' || coalesce(v_project_title, 'your project') || '".',
      NEW.project_id, NEW.id
    );

    perform dispatch_email_notification(
      v_owner_id,
      'New Adoption Request for ' || coalesce(v_project_title, 'your project'),
      'A developer has submitted a request to adopt "' || coalesce(v_project_title, 'your project') || '". Visit Code-Graveyard to review the application.'
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_notify_owner_on_adoption on public.adoptions;
create trigger trigger_notify_owner_on_adoption
  after insert on public.adoptions
  for each row execute function notify_owner_on_adoption_insert();

-- Trigger Function 2: Notify Adopter on Adoption Status Update
create or replace function notify_adopter_on_adoption_status_update()
returns trigger as $$
declare
  v_project_title text;
begin
  if OLD.status is distinct from NEW.status then
    select title into v_project_title
    from public.projects
    where id = NEW.project_id;

    insert into public.notifications (
      user_id, type, title, body, related_project_id, related_adoption_id
    ) values (
      NEW.adopter_id, 'adoption_status', 'Adoption Request ' || initcap(NEW.status::text),
      'Your request to adopt "' || coalesce(v_project_title, 'the project') || '" was ' || NEW.status::text || '.',
      NEW.project_id, NEW.id
    );

    perform dispatch_email_notification(
      NEW.adopter_id,
      'Adoption Request ' || initcap(NEW.status::text),
      'Your request to adopt "' || coalesce(v_project_title, 'the project') || '" was ' || NEW.status::text || '. Visit Code-Graveyard for details.'
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_notify_adopter_on_status_update on public.adoptions;
create trigger trigger_notify_adopter_on_status_update
  after update on public.adoptions
  for each row execute function notify_adopter_on_adoption_status_update();

-- ============================================================================
-- CONTENT MODERATION SYSTEM
-- ============================================================================

alter table public.users
  add column if not exists is_admin boolean default false;

create or replace function prevent_user_admin_mutation()
returns trigger as $$
begin
  if (NEW.is_admin is distinct from OLD.is_admin) then
    if (current_setting('role', true) not in ('service_role', 'postgres', 'supabase_admin')) then
      NEW.is_admin := OLD.is_admin;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_prevent_admin_mutation on public.users;
create trigger trigger_prevent_admin_mutation
  before update on public.users
  for each row execute function prevent_user_admin_mutation();

alter table public.projects
  add column if not exists is_hidden boolean default false;

alter table public.snippets
  add column if not exists is_hidden boolean default false;

create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.users(id) on delete cascade not null,
  target_type text check (target_type in ('project', 'snippet')) not null,
  target_id uuid not null,
  reason text check (reason in ('spam', 'harassment', 'plagiarism', 'inappropriate', 'other')) not null,
  details text,
  status text check (status in ('pending', 'reviewed', 'dismissed', 'actioned')) default 'pending' not null,
  created_at timestamptz default now() not null,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null,
  constraint unique_user_target_report unique (reporter_id, target_type, target_id)
);

alter table public.reports enable row level security;

drop policy if exists "Authenticated users can insert reports" on public.reports;
create policy "Authenticated users can insert reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Users can view own reports or admins view all" on public.reports;
create policy "Users can view own reports or admins view all"
  on public.reports for select
  using (
    auth.uid() = reporter_id or
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

-- AI-GENERATED SUMMARIES
alter table public.projects
  add column if not exists summary text,
  add column if not exists summary_generated_at timestamptz;

-- PGVECTOR SEMANTIC SEARCH
create extension if not exists vector;

alter table public.projects
  add column if not exists embedding vector(1536);

create index if not exists idx_projects_embedding_hnsw
  on public.projects using hnsw (embedding vector_cosine_ops);

-- SIMILAR PROJECTS RECOMMENDATION RPC
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

-- WEEKLY DIGEST EMAIL OPT-IN
alter table public.users
  add column if not exists digest_opted_in boolean default true;

create index if not exists idx_users_digest_opted_in
  on public.users (digest_opted_in)
  where digest_opted_in = true;






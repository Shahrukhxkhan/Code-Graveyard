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
  'abandoned'
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
    auth.uid() = (
      select user_id from public.projects
      where id = project_id
    )
  );
create policy "Authenticated users can create adoptions"
  on public.adoptions for insert
  with check (auth.uid() = adopter_id);
create policy "Project owner can update adoption status"
  on public.adoptions for update
  using (
    auth.uid() = (
      select user_id from public.projects
      where id = project_id
    )
  );

-- Saves policies
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

-- Increment view count function
create or replace function increment_view_count(project_id uuid)
returns void as $$
begin
  update public.projects
  set view_count = view_count + 1
  where id = project_id;
end;
$$ language plpgsql security definer;

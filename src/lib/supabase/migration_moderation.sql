-- ============================================================================
-- CONTENT MODERATION SYSTEM MIGRATION
-- ============================================================================

-- 1. ADD IS_ADMIN COLUMN TO USERS TABLE & PROTECT FROM CLIENT MUTATION
alter table public.users
  add column if not exists is_admin boolean default false;

-- Function to prevent non-service-role users from self-promoting to admin
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

-- SQL Snippet for manually promoting a user to admin via DB console / service role:
-- UPDATE public.users SET is_admin = true WHERE username = 'target_username';


-- 2. ADD IS_HIDDEN COLUMNS TO PROJECTS AND SNIPPETS FOR SOFT DELETION
alter table public.projects
  add column if not exists is_hidden boolean default false;

alter table public.snippets
  add column if not exists is_hidden boolean default false;


-- 3. CREATE REPORTS TABLE
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

-- Index for admin queue performance
create index if not exists idx_reports_status_created_at
  on public.reports (status, created_at desc);

create index if not exists idx_reports_reporter_created_at
  on public.reports (reporter_id, created_at desc);


-- 4. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.reports enable row level security;

-- Authenticated users can insert their own report on any target
drop policy if exists "Authenticated users can insert reports" on public.reports;
create policy "Authenticated users can insert reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- Users can view their own submitted reports; Admins can view all reports
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

-- Only admins can update reports
drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

-- Update Projects RLS policy to hide moderated (is_hidden = true) projects from public
drop policy if exists "Anyone can view projects" on public.projects;
create policy "Anyone can view non-hidden projects"
  on public.projects for select
  using (
    coalesce(is_hidden, false) = false or
    auth.uid() = user_id or
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

-- Update Snippets RLS policy to hide moderated (is_hidden = true) snippets from public
drop policy if exists "Anyone can view snippets" on public.snippets;
create policy "Anyone can view non-hidden snippets"
  on public.snippets for select
  using (
    coalesce(is_hidden, false) = false or
    auth.uid() = user_id or
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

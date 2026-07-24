-- ============================================================================
-- MIGRATION: NOTIFICATIONS SYSTEM & EMAIL DISPATCHER
-- ============================================================================

-- 1. Add email notification preferences to public.users
alter table public.users
  add column if not exists email_notifications_enabled boolean default true;

-- 2. Create NOTIFICATIONS table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null, -- 'adoption_request', 'adoption_status'
  title text not null,
  body text not null,
  related_project_id uuid references public.projects(id) on delete cascade,
  related_adoption_id uuid references public.adoptions(id) on delete cascade,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

-- RLS policies for notifications
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

-- Enable Supabase Realtime for notifications
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
exception when others then
  null;
end $$;

-- 3. Email Dispatcher Function (Fluggable & Fail-Safe)
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
  -- Check user preference
  select coalesce(email_notifications_enabled, true) into v_email_enabled
  from public.users where id = p_user_id;

  if not v_email_enabled or v_smtp_flag != 'true' then
    return;
  end if;

  -- Get user email from auth.users if available
  begin
    select email into v_user_email from auth.users where id = p_user_id;
  exception when others then
    v_user_email := null;
  end;

  if v_user_email is null then
    return;
  end if;

  -- Trigger HTTP webhook via pg_net if available (fail-safe)
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
    -- Fail gracefully if pg_net extension is not installed or network is offline
    null;
  end;
end;
$$ language plpgsql security definer;

-- 4. Trigger Function 1: Notify Project Owner on New Adoption Request
create or replace function notify_owner_on_adoption_insert()
returns trigger as $$
declare
  v_owner_id uuid;
  v_project_title text;
begin
  -- Get project owner and title
  select user_id, title into v_owner_id, v_project_title
  from public.projects
  where id = NEW.project_id;

  if v_owner_id is not null then
    -- Insert in-app notification for project owner
    insert into public.notifications (
      user_id,
      type,
      title,
      body,
      related_project_id,
      related_adoption_id
    ) values (
      v_owner_id,
      'adoption_request',
      'New Adoption Request',
      'A developer requested to adopt "' || coalesce(v_project_title, 'your project') || '".',
      NEW.project_id,
      NEW.id
    );

    -- Attempt email dispatch
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

-- 5. Trigger Function 2: Notify Adopter on Adoption Status Update
create or replace function notify_adopter_on_adoption_status_update()
returns trigger as $$
declare
  v_project_title text;
begin
  if OLD.status is distinct from NEW.status then
    -- Get project title
    select title into v_project_title
    from public.projects
    where id = NEW.project_id;

    -- Insert in-app notification for adopter
    insert into public.notifications (
      user_id,
      type,
      title,
      body,
      related_project_id,
      related_adoption_id
    ) values (
      NEW.adopter_id,
      'adoption_status',
      'Adoption Request ' || initcap(NEW.status::text),
      'Your request to adopt "' || coalesce(v_project_title, 'the project') || '" was ' || NEW.status::text || '.',
      NEW.project_id,
      NEW.id
    );

    -- Attempt email dispatch
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

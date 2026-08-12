create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  note text not null default '',
  category text not null default 'routine' check (category in ('urgent','important','routine','week','cases')),
  done boolean not null default false,
  task_date date not null default current_date,
  status text not null default 'active' check (status in ('active','archived')),
  owner text not null default 'Bác sĩ Trang',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists tasks_user_status_idx on public.tasks (user_id, status);
create index if not exists tasks_user_category_idx on public.tasks (user_id, category);
create index if not exists tasks_user_date_idx on public.tasks (user_id, task_date);

alter table public.tasks enable row level security;
grant select, insert, update, delete on public.tasks to authenticated;
revoke all on public.tasks from anon;

drop policy if exists "Users can read own tasks" on public.tasks;
create policy "Users can read own tasks" on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create own tasks" on public.tasks;
create policy "Users can create own tasks" on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks" on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.set_task_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at before update on public.tasks for each row execute function public.set_task_updated_at();

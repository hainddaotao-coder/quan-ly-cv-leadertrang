create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
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

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'user_id'
  ) then
    alter table public.tasks alter column user_id drop not null;
  end if;
end $$;

create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_category_idx on public.tasks (category);
create index if not exists tasks_date_idx on public.tasks (task_date);

alter table public.tasks enable row level security;
grant select, insert, update, delete on public.tasks to anon, authenticated;

drop policy if exists "Users can read own tasks" on public.tasks;
drop policy if exists "Users can create own tasks" on public.tasks;
drop policy if exists "Users can update own tasks" on public.tasks;
drop policy if exists "Users can delete own tasks" on public.tasks;
drop policy if exists "Public can read tasks" on public.tasks;
drop policy if exists "Public can create tasks" on public.tasks;
drop policy if exists "Public can update tasks" on public.tasks;
drop policy if exists "Public can delete tasks" on public.tasks;

create policy "Public can read tasks" on public.tasks for select to anon, authenticated using (true);
create policy "Public can create tasks" on public.tasks for insert to anon, authenticated with check (true);
create policy "Public can update tasks" on public.tasks for update to anon, authenticated using (true) with check (true);
create policy "Public can delete tasks" on public.tasks for delete to anon, authenticated using (true);

create or replace function public.set_task_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at before update on public.tasks for each row execute function public.set_task_updated_at();

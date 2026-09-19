create table if not exists public.roleta_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  consultant_name text not null check (char_length(consultant_name) between 1 and 100),
  theme text not null check (char_length(theme) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  received boolean not null default false,
  status text not null default 'waiting' check (status in ('waiting','draft','done')),
  scores jsonb not null default '[null,null,null,null,null]'::jsonb,
  feedback text not null default '' check (char_length(feedback) <= 5000)
);
alter table public.roleta_records enable row level security;
create index if not exists roleta_records_owner_created_idx on public.roleta_records(owner_id, created_at desc);
drop policy if exists "Users read own roleta records" on public.roleta_records;
drop policy if exists "Users insert own roleta records" on public.roleta_records;
drop policy if exists "Users update own roleta records" on public.roleta_records;
create policy "Users read own roleta records" on public.roleta_records for select to authenticated using (owner_id = auth.uid());
create policy "Users insert own roleta records" on public.roleta_records for insert to authenticated with check (owner_id = auth.uid());
create policy "Users update own roleta records" on public.roleta_records for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create or replace function public.roleta_touch_updated_at() returns trigger language plpgsql security definer set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists roleta_records_touch_updated_at on public.roleta_records;
create trigger roleta_records_touch_updated_at before update on public.roleta_records for each row execute function public.roleta_touch_updated_at();

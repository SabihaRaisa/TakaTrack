-- Run this entire file in Supabase Dashboard > SQL Editor.
-- RLS is the security boundary: every table is restricted to the signed-in owner.

create extension if not exists pgcrypto;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  amount numeric(14,2) not null check (amount > 0),
  category text not null check (length(trim(category)) between 1 and 60),
  note text check (note is null or length(note) <= 160),
  payment_method text not null default 'Cash',
  transaction_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions(user_id, transaction_date desc);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (length(trim(category)) between 1 and 60),
  month text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  limit_amount numeric(14,2) not null check (limit_amount > 0),
  created_at timestamptz not null default now(),
  unique(user_id, category, month)
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 70),
  target_amount numeric(14,2) not null check (target_amount > 0),
  saved_amount numeric(14,2) not null default 0 check (saved_amount >= 0 and saved_amount <= target_amount),
  target_date date,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;

drop policy if exists "Owners can read transactions" on public.transactions;
create policy "Owners can read transactions" on public.transactions for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Owners can insert transactions" on public.transactions;
create policy "Owners can insert transactions" on public.transactions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Owners can update transactions" on public.transactions;
create policy "Owners can update transactions" on public.transactions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Owners can delete transactions" on public.transactions;
create policy "Owners can delete transactions" on public.transactions for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Owners can read budgets" on public.budgets;
create policy "Owners can read budgets" on public.budgets for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Owners can insert budgets" on public.budgets;
create policy "Owners can insert budgets" on public.budgets for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Owners can update budgets" on public.budgets;
create policy "Owners can update budgets" on public.budgets for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Owners can delete budgets" on public.budgets;
create policy "Owners can delete budgets" on public.budgets for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Owners can read savings goals" on public.savings_goals;
create policy "Owners can read savings goals" on public.savings_goals for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Owners can insert savings goals" on public.savings_goals;
create policy "Owners can insert savings goals" on public.savings_goals for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Owners can update savings goals" on public.savings_goals;
create policy "Owners can update savings goals" on public.savings_goals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Owners can delete savings goals" on public.savings_goals;
create policy "Owners can delete savings goals" on public.savings_goals for delete to authenticated using (auth.uid() = user_id);

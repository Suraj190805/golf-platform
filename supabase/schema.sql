-- =============================================
-- Golf Charity Subscription Platform
-- Supabase Database Schema
-- =============================================
-- Run this in your Supabase SQL Editor (supabase.com > SQL Editor)

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  selected_charity_id uuid,
  charity_contribution_pct integer default 10 check (charity_contribution_pct >= 10 and charity_contribution_pct <= 100),
  subscription_status text default 'inactive' check (subscription_status in ('active', 'inactive', 'lapsed', 'cancelled')),
  subscription_plan text check (subscription_plan in ('monthly', 'yearly')),
  subscription_start date,
  subscription_end date,
  stripe_customer_id text,
  stripe_subscription_id text,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. CHARITIES TABLE
create table if not exists public.charities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  image_url text,
  website_url text,
  category text,
  is_featured boolean default false,
  upcoming_events jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. SCORES TABLE
create table if not exists public.scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score integer not null check (score >= 1 and score <= 45),
  played_date date not null,
  created_at timestamptz default now()
);

-- Index for fast score lookups per user
create index if not exists idx_scores_user_id on public.scores(user_id);

-- 4. DRAWS TABLE
create table if not exists public.draws (
  id uuid default gen_random_uuid() primary key,
  draw_date date not null,
  draw_month text not null, -- e.g. '2026-03'
  status text default 'pending' check (status in ('pending', 'simulated', 'published')),
  draw_type text default 'random' check (draw_type in ('random', 'algorithmic')),
  winning_numbers integer[] not null default '{}',
  prize_pool_total numeric(10,2) default 0,
  jackpot_rollover numeric(10,2) default 0,
  created_at timestamptz default now(),
  published_at timestamptz
);

-- 5. DRAW RESULTS TABLE
create table if not exists public.draw_results (
  id uuid default gen_random_uuid() primary key,
  draw_id uuid references public.draws(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_scores integer[] not null,
  matched_count integer not null check (matched_count >= 0 and matched_count <= 5),
  prize_amount numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- 6. WINNER VERIFICATIONS TABLE
create table if not exists public.winner_verifications (
  id uuid default gen_random_uuid() primary key,
  draw_result_id uuid references public.draw_results(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  proof_image_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid')),
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- 7. DONATIONS TABLE (independent donations, not tied to gameplay)
create table if not exists public.donations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  charity_id uuid references public.charities(id) on delete cascade not null,
  amount numeric(10,2) not null,
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.profiles enable row level security;
alter table public.charities enable row level security;
alter table public.scores enable row level security;
alter table public.draws enable row level security;
alter table public.draw_results enable row level security;
alter table public.winner_verifications enable row level security;
alter table public.donations enable row level security;

-- PROFILES: users can read/update their own profile; admins can read all
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "Admins can update all profiles" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- CHARITIES: anyone can read; admins can manage
create policy "Anyone can view charities" on public.charities for select using (true);
create policy "Admins can insert charities" on public.charities for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "Admins can update charities" on public.charities for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "Admins can delete charities" on public.charities for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- SCORES: users manage own scores; admins can manage all
create policy "Users can view own scores" on public.scores for select using (auth.uid() = user_id);
create policy "Users can insert own scores" on public.scores for insert with check (auth.uid() = user_id);
create policy "Users can update own scores" on public.scores for update using (auth.uid() = user_id);
create policy "Users can delete own scores" on public.scores for delete using (auth.uid() = user_id);
create policy "Admins can view all scores" on public.scores for select using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "Admins can update all scores" on public.scores for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- DRAWS: anyone authenticated can view published draws; admins manage
create policy "Users can view published draws" on public.draws for select using (status = 'published');
create policy "Admins can manage draws" on public.draws for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- DRAW RESULTS: users see their own; admins see all
create policy "Users can view own draw results" on public.draw_results for select using (auth.uid() = user_id);
create policy "Admins can manage draw results" on public.draw_results for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- WINNER VERIFICATIONS: users see own; admins manage
create policy "Users can view own verifications" on public.winner_verifications for select using (auth.uid() = user_id);
create policy "Users can insert own verifications" on public.winner_verifications for insert with check (auth.uid() = user_id);
create policy "Admins can manage verifications" on public.winner_verifications for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- DONATIONS: users manage own
create policy "Users can view own donations" on public.donations for select using (auth.uid() = user_id);
create policy "Users can insert donations" on public.donations for insert with check (auth.uid() = user_id);

-- =============================================
-- HELPER FUNCTION: auto-update updated_at
-- =============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_charities_updated
  before update on public.charities
  for each row execute function public.handle_updated_at();

-- =============================================
-- FUNCTION: create profile on signup
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- SEED DATA: sample charities
-- =============================================
insert into public.charities (name, description, category, is_featured) values
  ('Golf for Good Foundation', 'Supporting youth access to golf programs and sports education across underserved communities.', 'Youth & Sports', true),
  ('Green Fairways Trust', 'Dedicated to environmental conservation and sustainable golf course management worldwide.', 'Environment', true),
  ('Swing for Hope', 'Providing mental health support and community programs through golf-based therapy initiatives.', 'Health & Wellness', false),
  ('Caddie Scholarship Fund', 'Offering scholarships and education support for caddies and their families.', 'Education', false),
  ('Birdies for Veterans', 'Supporting veteran rehabilitation through golf therapy, adaptive sports and community reintegration.', 'Veterans', true);

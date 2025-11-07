-- Create users table to extend Supabase auth
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  plan text check (plan in ('free', 'pro')) not null default 'free',
  token_count integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create interview_sessions table to track user sessions
create table public.interview_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  job_title text not null,
  company_name text not null,
  job_description text not null,
  resume_data jsonb,
  transcript jsonb,
  tokens_used integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.interview_sessions enable row level security;

-- Create policies for users table
create policy "Users can view own profile" 
  on public.users for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.users for update 
  using (auth.uid() = id);

-- Create policies for interview_sessions table
create policy "Users can view own sessions" 
  on public.interview_sessions for select 
  using (auth.uid() = user_id);

create policy "Users can insert own sessions" 
  on public.interview_sessions for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own sessions" 
  on public.interview_sessions for update 
  using (auth.uid() = user_id);

-- Create function to automatically create user profile
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create user profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at_users 
  before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_interview_sessions 
  before update on public.interview_sessions
  for each row execute procedure public.handle_updated_at(); 
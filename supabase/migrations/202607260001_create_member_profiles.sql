create table if not exists public.member_profiles (

    id uuid primary key default gen_random_uuid(),

    user_id uuid not null unique references auth.users(id) on delete cascade,

    masar_id integer generated always as identity unique,

    joined_at timestamptz not null default now(),

    english_name text,

    country text,

    phone text,

    profession text,

    company text,

    linkedin text,

    avatar_url text,

    total_certificates integer default 0,

    total_projects integer default 0,

    total_completed_courses integer default 0,

    total_learning_hours integer default 0,

    created_at timestamptz default now(),

    updated_at timestamptz default now()

);
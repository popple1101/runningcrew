create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_sub text not null unique,
  nickname text not null,
  email text,
  photo_url text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Throttlist schema
-- Run this once in: Supabase dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles (one row per auth user)
create table if not exists profiles (
  id             uuid references auth.users(id) on delete cascade primary key,
  username       text unique not null,
  display_name   text not null,
  bio            text,
  avatar_url     text,
  location       text,
  instagram_handle text,
  youtube_handle text,
  is_pro         boolean default false,
  build_style    text,
  created_at     timestamptz default now()
);

-- Builds
create table if not exists builds (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references profiles(id) on delete cascade not null,
  year            int,
  make            text not null,
  model           text not null,
  nickname        text,
  slug            text,
  cover_photo_url text,
  build_type      text,
  status          text default 'active',
  is_public       boolean default true,
  follower_count  int default 0,
  created_at      timestamptz default now()
);

-- Parts
create table if not exists parts (
  id                  uuid default gen_random_uuid() primary key,
  build_id            uuid references builds(id) on delete cascade not null,
  name                text not null,
  category            text,
  type                text default 'linkable',
  source_url          text,
  notes               text,
  is_current          boolean default true,
  replaced_by_part_id uuid references parts(id),
  created_at          timestamptz default now()
);

-- Posts
create table if not exists posts (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references profiles(id) on delete cascade not null,
  build_id        uuid references builds(id) on delete set null,
  photos          text[] not null default '{}',
  caption         text,
  tagged_part_ids text[] default '{}',
  like_count      int default 0,
  comment_count   int default 0,
  view_count      int default 0,
  created_at      timestamptz default now()
);

-- Likes
create table if not exists likes (
  user_id    uuid references profiles(id) on delete cascade,
  post_id    uuid references posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- Comments
create table if not exists comments (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id) on delete cascade not null,
  post_id    uuid references posts(id) on delete cascade not null,
  parent_id  uuid references comments(id) on delete cascade,
  body       text not null,
  likes      int default 0,
  is_pinned  boolean default false,
  created_at timestamptz default now()
);

-- Follows
create table if not exists follows (
  follower_id  uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- Views (post analytics)
create table if not exists views (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id) on delete set null,
  post_id    uuid references posts(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Messages
create table if not exists messages (
  id           uuid default gen_random_uuid() primary key,
  sender_id    uuid references profiles(id) on delete cascade not null,
  recipient_id uuid references profiles(id) on delete cascade not null,
  body         text not null,
  is_read      boolean default false,
  created_at   timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table profiles  enable row level security;
alter table builds    enable row level security;
alter table parts     enable row level security;
alter table posts     enable row level security;
alter table likes     enable row level security;
alter table comments  enable row level security;
alter table follows   enable row level security;
alter table views     enable row level security;
alter table messages  enable row level security;

-- Profiles
create policy "profiles_public_read"   on profiles for select using (true);
create policy "profiles_owner_insert"  on profiles for insert with check (id = auth.uid());
create policy "profiles_owner_update"  on profiles for update using (id = auth.uid());

-- Builds
create policy "builds_public_read"     on builds for select using (is_public or user_id = auth.uid());
create policy "builds_owner_insert"    on builds for insert with check (user_id = auth.uid());
create policy "builds_owner_update"    on builds for update using (user_id = auth.uid());
create policy "builds_owner_delete"    on builds for delete using (user_id = auth.uid());

-- Parts
create policy "parts_public_read"      on parts for select using (true);
create policy "parts_build_owner_insert" on parts for insert with check (
  exists (select 1 from builds where id = build_id and user_id = auth.uid())
);
create policy "parts_build_owner_update" on parts for update using (
  exists (select 1 from builds where id = build_id and user_id = auth.uid())
);

-- Posts
create policy "posts_public_read"      on posts for select using (true);
create policy "posts_owner_insert"     on posts for insert with check (user_id = auth.uid());
create policy "posts_owner_update"     on posts for update using (user_id = auth.uid());
create policy "posts_owner_delete"     on posts for delete using (user_id = auth.uid());

-- Likes
create policy "likes_public_read"      on likes for select using (true);
create policy "likes_owner_insert"     on likes for insert with check (user_id = auth.uid());
create policy "likes_owner_delete"     on likes for delete using (user_id = auth.uid());

-- Comments
create policy "comments_public_read"   on comments for select using (true);
create policy "comments_owner_insert"  on comments for insert with check (user_id = auth.uid());
create policy "comments_owner_delete"  on comments for delete using (user_id = auth.uid());

-- Follows
create policy "follows_public_read"    on follows for select using (true);
create policy "follows_owner_insert"   on follows for insert with check (follower_id = auth.uid());
create policy "follows_owner_delete"   on follows for delete using (follower_id = auth.uid());

-- Views
create policy "views_auth_insert"      on views for insert with check (auth.uid() is not null);

-- Messages
create policy "messages_participant_read" on messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "messages_sender_insert" on messages for insert with check (sender_id = auth.uid());

-- ─── Auto-create profile on sign-up ──────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, build_style)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'build_style'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Storage buckets ─────────────────────────────────────────────────────────
-- Create these manually in Storage → New bucket (set to Public):
--   • posts    (post photos)
--   • avatars  (profile photos)
--   • builds   (build cover photos)

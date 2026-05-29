create table if not exists mfa_backup_codes (
  id        uuid      default gen_random_uuid() primary key,
  user_id   uuid      references profiles(id) on delete cascade not null,
  code      text      not null,
  used      boolean   default false,
  used_at   timestamptz,
  created_at timestamptz default now()
);
alter table mfa_backup_codes enable row level security;
create policy "mfa_backup_owner_all" on mfa_backup_codes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists mfa_backup_codes_user_id on mfa_backup_codes(user_id);

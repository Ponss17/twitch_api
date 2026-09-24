alter table public.users
    add column if not exists api_key_hash text;

create unique index if not exists users_api_key_hash_unique
    on public.users (api_key_hash)
    where api_key_hash is not null;

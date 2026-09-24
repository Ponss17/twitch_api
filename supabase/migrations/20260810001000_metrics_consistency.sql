create table if not exists public.viewer_activity_buckets (
    user_id text not null,
    activity_minute timestamptz not null,
    viewer_key text not null,
    display_name text not null,
    total bigint not null default 0,
    last_seen timestamptz not null,
    primary key (user_id, activity_minute, viewer_key)
);

alter table public.viewer_activity_buckets enable row level security;

create or replace function public.aggregate_viewer_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.activity_type not in ('clip', 'followage', 'watchtime', 'shoutout', 'magic8', 'russian', 'duel', 'slots') or
       new.user_name is null or lower(new.user_name) in ('anónimo', 'streamer', 'canal') then
        return new;
    end if;
    insert into public.viewer_activity_buckets
        (user_id, activity_minute, viewer_key, display_name, total, last_seen)
    values
        (new.user_id, date_trunc('minute', coalesce(new.created_at, now())), lower(trim(new.user_name)), trim(new.user_name), 1, coalesce(new.created_at, now()))
    on conflict (user_id, activity_minute, viewer_key) do update
    set total = viewer_activity_buckets.total + 1,
        display_name = excluded.display_name,
        last_seen = greatest(viewer_activity_buckets.last_seen, excluded.last_seen);
    return new;
end;
$$;

drop trigger if exists activity_logs_viewer_daily on public.activity_logs;
create trigger activity_logs_viewer_daily
after insert on public.activity_logs
for each row execute function public.aggregate_viewer_activity();

insert into public.viewer_activity_buckets
    (user_id, activity_minute, viewer_key, display_name, total, last_seen)
select
    a.user_id,
    date_trunc('minute', a.created_at),
    lower(trim(a.user_name)),
    max(trim(a.user_name)),
    count(*),
    max(a.created_at)
from public.activity_logs a
where a.activity_type in ('clip', 'followage', 'watchtime', 'shoutout', 'magic8', 'russian', 'duel', 'slots')
  and a.user_name is not null
  and lower(a.user_name) not in ('anónimo', 'streamer', 'canal')
group by a.user_id, date_trunc('minute', a.created_at), lower(trim(a.user_name))
on conflict (user_id, activity_minute, viewer_key) do nothing;

create or replace function public.get_viewer_leaderboard(
    p_user_id text,
    p_from_date date,
    p_to_date date,
    p_timezone text,
    p_limit integer
)
returns table (user_name text, total bigint, last_seen timestamptz)
language sql
security definer
set search_path = public
as $$
    select max(display_name), sum(v.total), max(v.last_seen)
    from public.viewer_activity_buckets v
    where v.user_id = p_user_id
      and (v.activity_minute at time zone p_timezone)::date between p_from_date and p_to_date
    group by v.viewer_key
    order by sum(v.total) desc, max(v.last_seen) desc
    limit least(greatest(p_limit, 1), 25);
$$;

create or replace function public.clear_user_stats_and_logs(p_user_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.viewer_activity_buckets where user_id = p_user_id;
    delete from public.activity_logs where user_id = p_user_id;
    delete from public.user_daily_stats where user_id = p_user_id;
    delete from public.user_stats where user_id = p_user_id;
end;
$$;

-- Trigger interno: nadie debe llamarlo por REST (/rpc/...).
revoke all on function public.aggregate_viewer_activity() from public;
revoke all on function public.aggregate_viewer_activity() from anon, authenticated;

-- Solo el backend (service_role) llama estas RPCs.
revoke all on function public.get_viewer_leaderboard(text, date, date, text, integer) from public;
revoke all on function public.get_viewer_leaderboard(text, date, date, text, integer) from anon, authenticated;
revoke all on function public.clear_user_stats_and_logs(text) from public;
revoke all on function public.clear_user_stats_and_logs(text) from anon, authenticated;
grant execute on function public.get_viewer_leaderboard(text, date, date, text, integer) to service_role;
grant execute on function public.clear_user_stats_and_logs(text) to service_role;

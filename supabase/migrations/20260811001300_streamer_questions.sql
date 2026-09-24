-- Historial de Preguntas: tope 100/usuario + caducidad 7 días + borrado manual.
create table if not exists public.streamer_questions (
    id text not null,
    user_id text not null,
    username text not null,
    display_name text not null,
    question_text text not null,
    status text not null default 'pending'
        check (status in ('pending', 'answered', 'skipped')),
    created_at timestamptz not null default now(),
    primary key (user_id, id)
);

create index if not exists streamer_questions_user_created_idx
    on public.streamer_questions (user_id, created_at desc);

alter table public.streamer_questions enable row level security;

revoke all on table public.streamer_questions from public;
revoke all on table public.streamer_questions from anon, authenticated;
grant all on table public.streamer_questions to service_role;

create or replace function public.prune_streamer_questions(
    p_user_id text,
    p_max integer default 100,
    p_max_age_days integer default 7
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.streamer_questions
    where user_id = p_user_id
      and created_at < now() - make_interval(days => greatest(p_max_age_days, 1));

    delete from public.streamer_questions q
    where q.user_id = p_user_id
      and q.ctid in (
          select ctid
          from public.streamer_questions
          where user_id = p_user_id
          order by created_at desc
          offset greatest(p_max, 1)
      );
end;
$$;

revoke all on function public.prune_streamer_questions(text, integer, integer) from public;
revoke all on function public.prune_streamer_questions(text, integer, integer) from anon, authenticated;
grant execute on function public.prune_streamer_questions(text, integer, integer) to service_role;

notify pgrst, 'reload schema';

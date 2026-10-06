-- Anonymous usage counter for Dispute Advisor. Run once in Supabase: SQL Editor > New query > Run.
-- Stores only a day, a fixed event name and a count. Nothing about people or evidence.

create table if not exists public.usage_counts (
  day   date   not null,
  event text   not null check (char_length(event) <= 64),
  count bigint not null default 0,
  primary key (day, event)
);

-- Row-level security on, and no policies: the public (anon) and logged-in roles can read and write nothing.
-- The server uses the service-role key, which bypasses row-level security.
alter table public.usage_counts enable row level security;
revoke all on public.usage_counts from anon, authenticated;

-- One call adds one to today's (UTC) count for an event.
create or replace function public.incr_usage(p_event text)
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.usage_counts (day, event, count)
  values ((now() at time zone 'utc')::date, p_event, 1)
  on conflict (day, event) do update set count = public.usage_counts.count + 1;
$$;

revoke all on function public.incr_usage(text) from public, anon, authenticated;
grant execute on function public.incr_usage(text) to service_role;
grant select, insert, update on public.usage_counts to service_role;

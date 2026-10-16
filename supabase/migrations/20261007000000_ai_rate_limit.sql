-- Per-user rate limit for the ai-suggestions Edge Function.
-- The function calls claim_ai_request with the caller's JWT before each Claude call;
-- auth.uid() identifies the user, so the limit can't be dodged by changing the request.

create table if not exists public.ai_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_requests_user_time on public.ai_requests (user_id, created_at desc);

-- No policies: rows are only read and written by claim_ai_request below.
alter table public.ai_requests enable row level security;

-- Returns 0 and records the request if the user is under both limits.
-- Otherwise returns the seconds until they can try again (nothing is recorded).
-- Returns -1 if there's no signed-in user.
create or replace function public.claim_ai_request(p_per_minute int, p_per_day int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  wait_seconds numeric;
begin
  if uid is null then
    return -1;
  end if;

  -- Serialize per user so parallel requests can't both slip under the limit.
  perform pg_advisory_xact_lock(hashtext('ai_requests:' || uid::text));

  delete from ai_requests where user_id = uid and created_at < now() - interval '1 day';

  if (select count(*) from ai_requests where user_id = uid) >= p_per_day then
    select extract(epoch from min(created_at) + interval '1 day' - now()) into wait_seconds
      from ai_requests where user_id = uid;
    return greatest(1, ceil(wait_seconds))::int;
  end if;

  if (select count(*) from ai_requests where user_id = uid and created_at > now() - interval '1 minute') >= p_per_minute then
    select extract(epoch from min(created_at) + interval '1 minute' - now()) into wait_seconds
      from ai_requests where user_id = uid and created_at > now() - interval '1 minute';
    return greatest(1, ceil(wait_seconds))::int;
  end if;

  insert into ai_requests (user_id) values (uid);
  return 0;
end;
$$;

revoke all on function public.claim_ai_request(int, int) from public, anon;
grant execute on function public.claim_ai_request(int, int) to authenticated;

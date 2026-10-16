-- Weekly catalog sync: pg_cron calls the sync-recipes Edge Function through pg_net.
-- The project URL and the function's shared secret come from Vault, so no secret is
-- stored in this file. Until both Vault secrets exist (see docs/BUILD_REPORT.md) the
-- job runs but its request is rejected; nothing else depends on it.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

select cron.schedule(
  'sync-recipes-weekly',
  '0 7 * * 1', -- Mondays 07:00 UTC
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/sync-recipes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sync_recipes_secret')
    ),
    body := '{"step": "all"}'::jsonb,
    timeout_milliseconds := 120000
  ) as request_id;
  $$
);

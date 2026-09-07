-- Run hourly reminders from the existing database, not Vercel Hobby Cron.
-- Configure Vault entries rehab_cron_secret and rehab_reminder_url separately.
-- The secret must match CRON_SECRET in the production Vercel environment.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create schema if not exists rehab_private;
revoke all on schema rehab_private from public, anon, authenticated;

create or replace function rehab_private.enqueue_reminders()
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  endpoint text;
  cron_secret text;
begin
  select decrypted_secret into endpoint
  from vault.decrypted_secrets where name = 'rehab_reminder_url';
  select decrypted_secret into cron_secret
  from vault.decrypted_secrets where name = 'rehab_cron_secret';

  if endpoint is null or endpoint !~ '^https://[^/]+/api/cron/rehab-reminders$'
    or cron_secret is null or length(cron_secret) < 32 then
    raise exception 'Rehab reminder URL or secret is not configured in Vault';
  end if;

  return net.http_get(
    url := endpoint,
    headers := jsonb_build_object('Authorization', 'Bearer ' || cron_secret),
    timeout_milliseconds := 30000
  );
end;
$$;

revoke all on function rehab_private.enqueue_reminders() from public, anon, authenticated;

-- Named schedule is idempotent. Secrets are read at runtime, never in job text.
select cron.schedule(
  'rehab-reminders-hourly',
  '17 * * * *',
  'select rehab_private.enqueue_reminders();'
);

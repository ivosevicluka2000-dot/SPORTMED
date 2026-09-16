-- Transactional email outbox. Only the worker may write/claim delivery records.
alter table public.rehab_appointments add column notification_version integer not null default 1;

create table public.rehab_appointment_emails (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null, -- Kept after an individual appointment is deleted.
  patient_id uuid not null references public.rehab_patients(id) on delete cascade,
  workspace_id uuid not null references public.rehab_workspaces(id) on delete cascade,
  version integer not null,
  event text not null check (event in ('created','updated','scheduled','completed','cancelled','deleted','reminder')),
  recipient text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','skipped')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  claim_token uuid,
  first_attempt_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (appointment_id, version, event)
);
create index rehab_appointment_emails_due_idx on public.rehab_appointment_emails(available_at)
  where status in ('pending','processing');
alter table public.rehab_appointment_emails enable row level security;
revoke all on public.rehab_appointment_emails from public, anon, authenticated;
grant select on public.rehab_appointment_emails to authenticated;
grant all on public.rehab_appointment_emails to service_role;
create policy rehab_appointment_emails_read on public.rehab_appointment_emails for select to authenticated
  using (public.rehab_can_edit_workspace(workspace_id));

create or replace function public.rehab_appointment_email_version()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- Caller-supplied versions must not suppress or duplicate notifications.
  if tg_op = 'INSERT' then
    new.notification_version := 1;
  else
    new.notification_version := old.notification_version;
    if (new.starts_at, new.duration_minutes, new.therapy, new.status, new.workspace_id, new.patient_id)
       is distinct from (old.starts_at, old.duration_minutes, old.therapy, old.status, old.workspace_id, old.patient_id) then
      new.notification_version := old.notification_version + 1;
    end if;
    -- Internal notes and contact edits must not send another reminder.
    if new.starts_at is distinct from old.starts_at or (new.status = 'scheduled' and old.status <> 'scheduled') then
      new.reminder_sent_at := null;
    end if;
  end if;
  return new;
end;
$$;
create trigger rehab_appointment_email_version before insert or update on public.rehab_appointments
  for each row execute function public.rehab_appointment_email_version();

create or replace function public.rehab_queue_appointment_email()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  a public.rehab_appointments;
  p public.rehab_patients;
  w public.rehab_workspaces;
  event_name text;
  previous_start timestamptz;
begin
  if tg_op = 'DELETE' then
    a := old;
    a.notification_version := old.notification_version + 1;
    event_name := 'deleted';
  elsif tg_op = 'INSERT' then
    a := new;
    event_name := 'created';
  else
    if new.notification_version = old.notification_version then return new; end if;
    a := new;
    previous_start := old.starts_at;
    event_name := case when new.status is distinct from old.status then new.status else 'updated' end;
  end if;

  update public.rehab_appointment_emails set status = 'skipped', last_error = 'superseded'
    where appointment_id = a.id and status in ('pending','processing');

  -- A workspace transfer is not a new booking. Cascaded card deletions send nothing.
  if tg_op = 'UPDATE' and (new.workspace_id, new.patient_id) is distinct from (old.workspace_id, old.patient_id) then
    return new;
  end if;
  if tg_op = 'DELETE' and old.status = 'cancelled' and exists (
    select 1 from public.rehab_appointment_emails e
    where e.appointment_id = old.id and e.version = old.notification_version
      and e.event = 'cancelled' and e.status = 'sent'
  ) then return old; end if;
  select * into p from public.rehab_patients where id = a.patient_id and workspace_id = a.workspace_id;
  if not found or nullif(btrim(p.email::text), '') is null then return a; end if;
  select * into w from public.rehab_workspaces where id = a.workspace_id;
  insert into public.rehab_appointment_emails(appointment_id, patient_id, workspace_id, version, event, recipient, payload)
  values (a.id, p.id, w.id, a.notification_version, event_name, btrim(p.email::text), jsonb_build_object(
    'patientName', p.first_name || ' ' || p.last_name,
    'workspaceName', w.name, 'locale', case when w.kind = 'club' then 'en' else 'sr' end,
    'startsAt', a.starts_at, 'previousStartsAt', previous_start,
    'durationMinutes', a.duration_minutes, 'appointmentStatus', a.status
  ));
  return a;
end;
$$;
create trigger rehab_queue_appointment_email after insert or update or delete on public.rehab_appointments
  for each row execute function public.rehab_queue_appointment_email();

create or replace function public.rehab_enqueue_due_appointment_reminders()
returns void language sql security definer set search_path = '' as $$
  insert into public.rehab_appointment_emails(appointment_id, patient_id, workspace_id, version, event, recipient, payload)
  select a.id, p.id, w.id, a.notification_version, 'reminder', btrim(p.email::text), jsonb_build_object(
    'patientName', p.first_name || ' ' || p.last_name, 'workspaceName', w.name,
    'locale', case when w.kind = 'club' then 'en' else 'sr' end,
    'startsAt', a.starts_at, 'durationMinutes', a.duration_minutes, 'appointmentStatus', a.status
  ) from public.rehab_appointments a
  join public.rehab_patients p on p.id = a.patient_id and p.workspace_id = a.workspace_id
  join public.rehab_workspaces w on w.id = a.workspace_id
  where a.status = 'scheduled' and a.reminder_sent_at is null
    and nullif(btrim(p.email::text), '') is not null
    and a.starts_at > now() and a.starts_at - a.reminder_hours_before * interval '1 hour' <= now()
    -- A last-minute confirmation/update already serves as the reminder.
    and not exists (select 1 from public.rehab_appointment_emails e
      where e.appointment_id = a.id and e.version = a.notification_version and e.event <> 'reminder'
        and e.created_at >= a.starts_at - a.reminder_hours_before * interval '1 hour')
  on conflict (appointment_id, version, event) do nothing;
$$;

create or replace function public.rehab_claim_appointment_emails(
  p_appointment_id uuid default null, p_workspace_id uuid default null, p_limit integer default 20
)
returns setof public.rehab_appointment_emails
language plpgsql security definer set search_path = '' as $$
begin
  -- Resend retains idempotency keys for 24 hours. Never retry outside that window.
  update public.rehab_appointment_emails e set status = 'failed', last_error = 'retry_limit'
    where status in ('pending','processing') and (first_attempt_at < now() - interval '23 hours'
      or (attempts >= 4 and (status = 'pending' or locked_at < now() - interval '2 minutes')));
  update public.rehab_appointment_emails e set status = 'skipped', last_error = 'stale'
    where status in ('pending','processing') and (
      e.created_at < now() - interval '24 hours'
      or not exists (select 1 from public.rehab_patients p where p.id = e.patient_id
        and p.workspace_id = e.workspace_id and lower(btrim(p.email::text)) = lower(e.recipient))
      or (e.event <> 'deleted' and not exists (select 1 from public.rehab_appointments a
        where a.id = e.appointment_id and a.workspace_id = e.workspace_id and a.notification_version = e.version
        and (e.event not in ('created','scheduled','reminder') or (a.status = 'scheduled' and a.starts_at > now()))))
    );
  return query
  with due as (
    select e.id from public.rehab_appointment_emails e
    where (e.status = 'pending' or (e.status = 'processing' and e.locked_at < now() - interval '2 minutes'))
      and e.available_at <= now() and e.attempts < 4
      and (p_appointment_id is null or e.appointment_id = p_appointment_id)
      and (p_workspace_id is null or e.workspace_id = p_workspace_id)
    order by e.available_at, e.id for update skip locked limit greatest(1, least(p_limit, 20))
  )
  update public.rehab_appointment_emails e set status = 'processing', attempts = e.attempts + 1,
    locked_at = now(), claim_token = gen_random_uuid(), first_attempt_at = coalesce(e.first_attempt_at, now())
  from due where e.id = due.id returning e.*;
end;
$$;

revoke all on function public.rehab_appointment_email_version() from public, anon, authenticated;
revoke all on function public.rehab_queue_appointment_email() from public, anon, authenticated;
revoke all on function public.rehab_enqueue_due_appointment_reminders() from public, anon, authenticated;
revoke all on function public.rehab_claim_appointment_emails(uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.rehab_enqueue_due_appointment_reminders() to service_role;
grant execute on function public.rehab_claim_appointment_emails(uuid,uuid,integer) to service_role;

-- No historical confirmations. Legacy reminder_sent_at is preserved.
-- Reuse the existing Vault-protected scheduler when installed (not in local PGlite).
do $$ declare scheduler_id bigint; begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    select jobid into scheduler_id from cron.job where jobname = 'rehab-reminders-hourly';
    if scheduler_id is not null then
      -- Pause until the new worker is deployed and Vault/CRON_SECRET are verified.
      perform cron.alter_job(scheduler_id, schedule := '* * * * *', active := false);
    end if;
  end if;
end $$;

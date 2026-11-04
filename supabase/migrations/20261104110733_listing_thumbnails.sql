-- Optional listing thumbnails. Existing rows remain unchanged (NULL).
-- The avatars bucket already stores owner-scoped public profile/portfolio media
-- and its existing Storage API erasure inventory includes every owner prefix.
set local lock_timeout = '3s';

alter table public.jobs add column if not exists thumbnail_path text;
alter table public.freelancer_services add column if not exists thumbnail_path text;

do $migration$
begin
  if not exists(select 1 from pg_constraint where conrelid='public.jobs'::regclass and conname='jobs_thumbnail_owner_path_check') then
    alter table public.jobs add constraint jobs_thumbnail_owner_path_check check (
      thumbnail_path is null or thumbnail_path ~ (
        '^' || user_id::text || '/listing-thumbnails/jobs/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](webp|png|jpg)$'
      )
    );
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.freelancer_services'::regclass and conname='services_thumbnail_owner_path_check') then
    alter table public.freelancer_services add constraint services_thumbnail_owner_path_check check (
      thumbnail_path is null or thumbnail_path ~ (
        '^' || freelancer_id::text || '/listing-thumbnails/services/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](webp|png|jpg)$'
      )
    );
  end if;
end;
$migration$;

create index if not exists jobs_thumbnail_path_idx on public.jobs(thumbnail_path) where thumbnail_path is not null;
create index if not exists services_thumbnail_path_idx on public.freelancer_services(thumbnail_path) where thumbnail_path is not null;

comment on column public.jobs.thumbnail_path is 'Optional owner-scoped path in the avatars public-media bucket. Listing thumbnail, not a private work attachment.';
comment on column public.freelancer_services.thumbnail_path is 'Optional owner-scoped path in the avatars public-media bucket. Listing thumbnail, not a private work attachment.';

-- Reject any existing scraped events that have no external_url
-- (user_submission events are exempt — a link is optional for manually added events)
update public.events
set status = 'rejected'
where source != 'user_submission'
  and (external_url is null or trim(external_url) = '');

-- Prevent future scraped events from being inserted without a link
alter table public.events
  add constraint scraped_events_require_url check (
    source = 'user_submission'
    or (external_url is not null and trim(external_url) != '')
  );
 
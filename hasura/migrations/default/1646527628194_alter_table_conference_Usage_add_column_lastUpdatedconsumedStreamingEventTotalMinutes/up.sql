alter table "conference"."Usage" add column "lastUpdatedconsumedStreamingEventTotalMinutes" timestamptz
 not null default now();

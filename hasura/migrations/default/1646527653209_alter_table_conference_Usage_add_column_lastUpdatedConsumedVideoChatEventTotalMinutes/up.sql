alter table "conference"."Usage" add column "lastUpdatedConsumedVideoChatEventTotalMinutes" timestamptz
 not null default now();

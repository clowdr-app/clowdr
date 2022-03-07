alter table "conference"."Usage" add column "lastUpdatedConsumedVideoChatNonEventTotalMinutes" timestamptz
 not null default now();

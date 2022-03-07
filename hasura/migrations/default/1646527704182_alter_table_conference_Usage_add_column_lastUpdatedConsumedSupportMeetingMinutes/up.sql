alter table "conference"."Usage" add column "lastUpdatedConsumedSupportMeetingMinutes" timestamptz
 not null default now();

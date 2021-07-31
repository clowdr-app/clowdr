alter table "room"."ShuffleQueueEntry" add column "isExpired" boolean
 not null default 'false';

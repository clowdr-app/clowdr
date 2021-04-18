alter table "room"."RoomChimeMeeting" alter column "externalChimeMeetingId" drop not null;
alter table "room"."RoomChimeMeeting" add column "externalChimeMeetingId" text;

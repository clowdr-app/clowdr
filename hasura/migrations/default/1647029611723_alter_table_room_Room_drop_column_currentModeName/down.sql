alter table "room"."Room" alter column "currentModeName" set default ''VIDEO_CHAT'::text';
alter table "room"."Room" add constraint "Room_currentMode_fkey" unique (currentModeName);
alter table "room"."Room"
  add constraint "Room_currentMode_fkey"
  foreign key (currentModeName)
  references "room"."Mode"
  (name) on update cascade on delete restrict;
alter table "room"."Room" alter column "currentModeName" drop not null;
alter table "room"."Room" add column "currentModeName" text;

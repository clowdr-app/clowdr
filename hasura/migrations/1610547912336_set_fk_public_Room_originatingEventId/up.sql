alter table "public"."Room"
           add constraint "Room_originatingEventId_fkey"
           foreign key ("originatingEventId")
           references "public"."Event"
           ("id") on update cascade on delete set null;

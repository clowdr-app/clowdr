alter table "chat"."Pin"
           add constraint "Pin_attendeeId_fkey"
           foreign key ("attendeeId")
           references "public"."Attendee"
           ("id") on update cascade on delete cascade;

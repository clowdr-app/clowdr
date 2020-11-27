alter table "public"."Attendee"
           add constraint "Attendee_status_fkey"
           foreign key ("status")
           references "public"."AttendeeStatus"
           ("name") on update cascade on delete restrict;

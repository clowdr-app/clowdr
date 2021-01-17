alter table "public"."Room"
           add constraint "Room_originatingContentGroupId_fkey"
           foreign key ("originatingContentGroupId")
           references "public"."ContentGroup"
           ("id") on update cascade on delete set null;

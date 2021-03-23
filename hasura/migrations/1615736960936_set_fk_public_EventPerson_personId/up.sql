alter table "public"."EventPerson"
           add constraint "EventPerson_personId_fkey"
           foreign key ("personId")
           references "public"."ContentPerson"
           ("id") on update cascade on delete cascade;

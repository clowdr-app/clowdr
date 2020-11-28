alter table "public"."Conference"
           add constraint "Conference_demoCodeId_fkey"
           foreign key ("demoCodeId")
           references "public"."ConferenceDemoCodes"
           ("id") on update cascade on delete restrict;

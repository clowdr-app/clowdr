alter table "chat"."Reaction"
           add constraint "Reaction_messageSId_fkey"
           foreign key ("messageSId")
           references "chat"."Message"
           ("sId") on update cascade on delete restrict;

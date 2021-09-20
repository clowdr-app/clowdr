alter table "chat"."Reaction" drop constraint "Reaction_messageSId_fkey",
             add constraint "Reaction_messageSId_fkey"
             foreign key ("messageSId")
             references "chat"."Message"
             ("sId") on update cascade on delete cascade;

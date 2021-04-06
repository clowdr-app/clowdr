alter table "chat"."Reaction"
           add constraint "Reaction_duplicateSId_fkey"
           foreign key ("duplicateSId")
           references "chat"."Reaction"
           ("sId") on update cascade on delete cascade;

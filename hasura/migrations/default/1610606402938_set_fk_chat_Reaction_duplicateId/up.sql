alter table "chat"."Reaction"
           add constraint "Reaction_duplicateId_fkey"
           foreign key ("duplicateId")
           references "chat"."Reaction"
           ("id") on update cascade on delete set null;

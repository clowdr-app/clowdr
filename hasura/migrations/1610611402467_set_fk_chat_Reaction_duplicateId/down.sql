alter table "chat"."Reaction" drop constraint "Reaction_duplicateId_fkey",
          add constraint "Reaction_duplicateId_fkey"
          foreign key ("duplicateId")
          references "chat"."Reaction"
          ("id")
          on update cascade
          on delete set null;

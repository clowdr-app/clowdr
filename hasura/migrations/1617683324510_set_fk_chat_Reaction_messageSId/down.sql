alter table "chat"."Reaction" drop constraint "Reaction_messageSId_fkey",
          add constraint "Reaction_messageSId_fkey"
          foreign key ("type")
          references "chat"."ReactionType"
          ("name")
          on update cascade
          on delete restrict;

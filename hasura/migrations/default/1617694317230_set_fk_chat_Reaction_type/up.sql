alter table "chat"."Reaction"
           add constraint "Reaction_type_fkey"
           foreign key ("type")
           references "chat"."ReactionType"
           ("name") on update cascade on delete restrict;

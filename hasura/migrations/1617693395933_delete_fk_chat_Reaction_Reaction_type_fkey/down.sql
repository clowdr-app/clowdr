alter table "chat"."Reaction" add foreign key ("type") references "chat"."ReactionType"("name") on update cascade on delete restrict;

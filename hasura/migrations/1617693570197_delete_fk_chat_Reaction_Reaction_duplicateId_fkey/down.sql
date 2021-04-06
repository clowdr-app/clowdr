alter table "chat"."Reaction" add foreign key ("duplicateId") references "chat"."Reaction"("id") on update cascade on delete cascade;

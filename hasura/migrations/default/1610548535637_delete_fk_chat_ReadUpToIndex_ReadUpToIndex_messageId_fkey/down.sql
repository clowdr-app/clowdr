alter table "chat"."ReadUpToIndex" add foreign key ("messageId") references "chat"."Message"("id") on update cascade on delete cascade;

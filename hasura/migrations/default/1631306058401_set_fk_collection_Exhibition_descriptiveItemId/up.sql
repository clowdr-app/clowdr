alter table "collection"."Exhibition"
  add constraint "Exhibition_descriptiveItemId_fkey"
  foreign key ("descriptiveItemId")
  references "content"."Item"
  ("id") on update cascade on delete set null;

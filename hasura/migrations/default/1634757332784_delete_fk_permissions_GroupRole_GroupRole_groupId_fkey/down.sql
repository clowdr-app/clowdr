alter table "permissions"."GroupRole"
  add constraint "GroupRole_groupId_fkey"
  foreign key ("groupId")
  references "permissions"."Group"
  ("id") on update cascade on delete cascade;

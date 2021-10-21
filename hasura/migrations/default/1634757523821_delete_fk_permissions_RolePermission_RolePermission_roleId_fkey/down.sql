alter table "permissions"."RolePermission"
  add constraint "RolePermission_roleId_fkey"
  foreign key ("roleId")
  references "permissions"."Role"
  ("id") on update cascade on delete cascade;

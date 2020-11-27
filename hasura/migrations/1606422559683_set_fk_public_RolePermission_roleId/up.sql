alter table "public"."RolePermission"
           add constraint "RolePermission_roleId_fkey"
           foreign key ("roleId")
           references "public"."Role"
           ("id") on update cascade on delete cascade;

ALTER TRIGGER "set_public_Group_updated_at" ON "permissions"."Group"
    RENAME TO "set_permissions_Group_updated_at";

ALTER TRIGGER "set_public_GroupRole_updated_at" ON "permissions"."GroupRole"
    RENAME TO "set_permissions_GroupRole_updated_at";

ALTER TRIGGER "set_public_Role_updated_at" ON "permissions"."Role"
    RENAME TO "set_permissions_Role_updated_at";

ALTER TRIGGER "set_public_RolePermission_updated_at" ON "permissions"."RolePermission"
    RENAME TO "set_permissions_RolePermission_updated_at";

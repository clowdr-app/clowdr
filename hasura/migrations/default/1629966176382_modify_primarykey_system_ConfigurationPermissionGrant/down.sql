alter table "system"."ConfigurationPermissionGrant"
    add constraint "ConfigurationPermissionGrant_permissionName_userId_configur_key"
    primary key ("configurationKey", "userId", "permissionName");

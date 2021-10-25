alter table "system"."ConfigurationPermissionGrant" add constraint "ConfigurationPermissionGrant_permissionName_configurationKey_userId_key" unique ("permissionName", "configurationKey", "userId");

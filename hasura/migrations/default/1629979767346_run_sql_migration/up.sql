CREATE VIEW "system"."SuperUserState"
AS SELECT (COUNT(*) > 0)  AS "isInitialised"
   FROM "system"."SuperUserPermissionGrant"
   WHERE "grantedPermissionName" = 'INSERT_SU_PERMISSION'
   AND "targetPermissionName" = 'INSERT_SU_PERMISSION';

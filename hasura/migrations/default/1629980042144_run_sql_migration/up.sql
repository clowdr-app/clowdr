CREATE OR REPLACE VIEW "system"."SuperUserState" AS 
 SELECT ((
    SELECT COUNT(*) FROM system."SuperUserPermissionGrant"
    WHERE ("SuperUserPermissionGrant"."grantedPermissionName" = 'INSERT_SU_PERMISSION'::text) 
    AND ("SuperUserPermissionGrant"."targetPermissionName" = 'INSERT_SU_PERMISSION'::text)
    ) > 0) AS "isInitialised",
    ((
    SELECT COUNT(*) FROM public."User"
    ) = 1) AS "canBeDirectlyInitialised";

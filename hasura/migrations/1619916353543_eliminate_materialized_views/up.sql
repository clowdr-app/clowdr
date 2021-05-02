CREATE OR REPLACE VIEW "public"."FlatUserPermission" AS (
    WITH 
    user_attendees AS 
        (SELECT "public"."User"."id" as user_id, "registrant"."Registrant"."id" as registrant_id
            FROM "public"."User" INNER JOIN "registrant"."Registrant"
            ON "public"."User"."id" = "registrant"."Registrant"."userId"
        ),
    user_groups AS
        (SELECT user_id, "permissions"."GroupRegistrant"."groupId" as group_id
            FROM user_attendees INNER JOIN "permissions"."GroupRegistrant"
            ON registrant_id = "permissions"."GroupRegistrant"."registrantId"
        ),
    user_groups_enabled AS
        (SELECT user_id, group_id, "permissions"."Group"."conferenceId" as conference_id
            FROM user_groups INNER JOIN "permissions"."Group"
            ON "permissions"."Group"."enabled" = true AND group_id = "permissions"."Group"."id"
        ),
    user_roles AS
        (SELECT user_id, conference_id, "permissions"."GroupRole"."roleId" as role_id
            FROM user_groups_enabled INNER JOIN "permissions"."GroupRole"
            ON group_id = "permissions"."GroupRole"."groupId"
        ),
    user_permissions AS
        (SELECT user_id, conference_id, "permissions"."RolePermission"."permissionName" as permission_name
            FROM user_roles INNER JOIN "permissions"."RolePermission"
            ON role_id = "permissions"."RolePermission"."roleId"
        ),
    user_permissions_slugs AS
        (SELECT DISTINCT user_id, "conference"."Conference"."slug" as slug, permission_name
            FROM user_permissions INNER JOIN "conference"."Conference"
            ON conference_id = "conference"."Conference"."id"
        )
    SELECT * FROM user_permissions_slugs
);
CREATE OR REPLACE VIEW "public"."FlatUnauthPermission" AS (
    WITH
    public_groups_enabled AS
        (SELECT "permissions"."Group"."id" as group_id, "permissions"."Group"."conferenceId" as conference_id
            FROM "permissions"."Group"
            WHERE "permissions"."Group"."enabled" = true AND "permissions"."Group"."includeUnauthenticated" = true
        ),
    roles AS
        (SELECT conference_id, "permissions"."GroupRole"."roleId" as role_id
            FROM public_groups_enabled INNER JOIN "permissions"."GroupRole"
            ON group_id = "permissions"."GroupRole"."groupId"
        ),
    permissions AS
        (SELECT conference_id, "permissions"."RolePermission"."permissionName" as permission_name
            FROM roles INNER JOIN "permissions"."RolePermission"
            ON role_id = "permissions"."RolePermission"."roleId"
        ),
    permissions_slugs AS
        (SELECT DISTINCT "conference"."Conference"."slug" as slug, permission_name
            FROM permissions INNER JOIN "conference"."Conference"
            ON conference_id = "conference"."Conference"."id"
        )
    SELECT * FROM permissions_slugs
);

DROP TRIGGER refresh_flat_user_permission ON "registrant"."Registrant";
DROP FUNCTION public.refresh_flat_user_permission;

DROP MATERIALIZED VIEW "public"."mat_FlatUserPermission";
DROP MATERIALIZED VIEW "public"."mat_FlatUnauthPermission";

CREATE VIEW "public"."FlatUnauthPermission" AS
    (WITH
        public_groups_enabled AS
            (SELECT "public"."Group"."id" as group_id, "public"."Group"."conferenceId" as conference_id
                FROM "public"."Group"
                WHERE "public"."Group"."enabled" = true AND "public"."Group"."includeUnauthenticated" = true
            ),
        roles AS
            (SELECT conference_id, "public"."GroupRole"."roleId" as role_id
                FROM public_groups_enabled INNER JOIN "public"."GroupRole"
                ON group_id = "public"."GroupRole"."groupId"
            ),
        permissions AS
            (SELECT conference_id, "public"."RolePermission"."permissionName" as permission_name
                FROM roles INNER JOIN "public"."RolePermission"
                ON role_id = "public"."RolePermission"."roleId"
            ),
        permissions_slugs AS
            (SELECT "public"."Conference"."slug" as slug, permission_name
                FROM permissions INNER JOIN "public"."Conference"
                ON conference_id = "public"."Conference"."id"
            )
        SELECT * FROM permissions_slugs
    );

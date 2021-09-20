CREATE VIEW "public"."FlatUserPermission" AS
    (WITH 
        user_attendees AS 
            (SELECT "public"."User"."id" as user_id, "public"."Attendee"."id" as attendee_id
                FROM "public"."User" INNER JOIN "public"."Attendee"
                ON "public"."User"."id" = "public"."Attendee"."userId"
            ),
        user_groups AS
            (SELECT user_id, "public"."GroupAttendee"."groupId" as group_id
                FROM user_attendees INNER JOIN "public"."GroupAttendee"
                ON attendee_id = "public"."GroupAttendee"."attendeeId"
            ),
        user_groups_enabled AS
            (SELECT user_id, group_id, "public"."Group"."conferenceId" as conference_id
                FROM user_groups INNER JOIN "public"."Group"
                ON "public"."Group"."enabled" = true AND group_id = "public"."Group"."id"
            ),
        user_roles AS
            (SELECT user_id, conference_id, "public"."GroupRole"."roleId" as role_id
                FROM user_groups_enabled INNER JOIN "public"."GroupRole"
                ON group_id = "public"."GroupRole"."groupId"
            ),
        user_permissions AS
            (SELECT user_id, conference_id, "public"."RolePermission"."permissionName" as permission_name
                FROM user_roles INNER JOIN "public"."RolePermission"
                ON role_id = "public"."RolePermission"."roleId"
            ),
        user_permissions_slugs AS
            (SELECT user_id, "public"."Conference"."slug" as slug, permission_name
                FROM user_permissions INNER JOIN "public"."Conference"
                ON conference_id = "public"."Conference"."id"
            )
        SELECT * FROM user_permissions_slugs
    );

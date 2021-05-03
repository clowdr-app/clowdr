CREATE INDEX "public_Email_userId" ON "public"."Email" ("userId");
CREATE INDEX "public_Email_invitationId" ON "public"."Email" ("invitationId");
CREATE INDEX "public_Email_reason" ON "public"."Email" ("reason");

CREATE INDEX "public_PushNotificationSubscription_userId" ON "public"."PushNotificationSubscription" ("userId");
CREATE INDEX "public_PushNotificationSubscription_endpoint" ON "public"."PushNotificationSubscription" ("endpoint");

CREATE INDEX "public_User_email" ON "public"."User" ("email");

ALTER TRIGGER "lowercase_email" ON "public"."User"
    RENAME TO "lowercaseEmail";

ALTER FUNCTION "public"."delete_room_people_before_room"
    SET SCHEMA "room";
ALTER FUNCTION "room"."delete_room_people_before_room"
    RENAME TO "deleteRoomPeopleBeforeRoom";

ALTER FUNCTION "public"."invitation_set_conference_id"
    RENAME TO "invitationSetConferenceId";

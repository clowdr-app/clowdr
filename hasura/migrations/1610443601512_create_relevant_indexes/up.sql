/* Conference by slug */
CREATE INDEX IF NOT EXISTS slug ON "Conference" ("slug") INCLUDE ("id", "name", "shortName");
CREATE INDEX IF NOT EXISTS creator_id ON "Conference" ("createdBy") INCLUDE ("id");

/* Group attendee */
CREATE INDEX IF NOT EXISTS group_id ON "GroupAttendee" ("groupId") INCLUDE ("attendeeId");
CREATE INDEX IF NOT EXISTS attendee_id ON "GroupAttendee" ("attendeeId") INCLUDE ("groupId");

/* Group role */
CREATE INDEX IF NOT EXISTS group_id ON "GroupRole" ("groupId") INCLUDE ("roleId");
CREATE INDEX IF NOT EXISTS role_id ON "GroupRole" ("roleId") INCLUDE ("groupId");

/* Group */
CREATE INDEX IF NOT EXISTS conference_id ON "Group" ("conferenceId", "enabled", "includeUnauthenticated") INCLUDE ("id");

/* Role permission */
CREATE INDEX IF NOT EXISTS group_id ON "RolePermission" ("roleId") INCLUDE ("permissionName");
CREATE INDEX IF NOT EXISTS role_id ON "RolePermission" ("permissionName") INCLUDE ("roleId");


/* "X by conference id" */
CREATE INDEX IF NOT EXISTS conference_id ON "Attendee" ("conferenceId") INCLUDE ("displayName");
CREATE INDEX IF NOT EXISTS conference_id ON "ContentGroup" ("conferenceId");
CREATE INDEX IF NOT EXISTS conference_id ON "Tag" ("conferenceId");
CREATE INDEX IF NOT EXISTS conference_id ON "Room" ("conferenceId");
CREATE INDEX IF NOT EXISTS conference_id ON "RoomParticipant" ("conferenceId");
CREATE INDEX IF NOT EXISTS conference_id ON "ConferencePrepareJob" ("conferenceId");
CREATE INDEX IF NOT EXISTS conference_id ON "Transitions" ("conferenceId");

/* Room by vonage session */
CREATE INDEX IF NOT EXISTS vonage_session_id ON "Room" ("publicVonageSessionId") INCLUDE ("id");

/* Room person by room id */
CREATE INDEX IF NOT EXISTS room_id ON "RoomPerson" ("roomId") INCLUDE ("attendeeId") WITH (fillfactor = 40);

/* Room by privacy */
CREATE INDEX IF NOT EXISTS privacy ON "Room" ("roomPrivacyName");

/* Attendee by user id */
CREATE INDEX IF NOT EXISTS user_id ON "Attendee" ("userId");

/* Content group by type */
CREATE INDEX IF NOT EXISTS type_name ON "ContentGroup" ("contentGroupTypeName");

/* Content group tag by tag */
CREATE INDEX IF NOT EXISTS tag_id ON "ContentGroupTag" ("tagId") INCLUDE ("contentGroupId");
/* Content group tag by group */
CREATE INDEX IF NOT EXISTS group_id ON "ContentGroupTag" ("contentGroupId") INCLUDE ("tagId");
/* Content group hallway by group */
CREATE INDEX IF NOT EXISTS group_id ON "ContentGroupHallway" ("groupId");
/* Content group person by group */
CREATE INDEX IF NOT EXISTS group_id ON "ContentGroupPerson" ("groupId");

/* Content item by group */
CREATE INDEX IF NOT EXISTS group_id ON "ContentItem" ("contentGroupId");

/* Event by content group */
CREATE INDEX IF NOT EXISTS group_id ON "Event" ("contentGroupId");
/* Event by room */
CREATE INDEX IF NOT EXISTS room_id ON "Event" ("roomId");

/* Event person by event */
CREATE INDEX IF NOT EXISTS event_id ON "EventPerson" ("eventId");
/* Event tag by event */
CREATE INDEX IF NOT EXISTS event_id ON "EventTag" ("eventId");

/* Event participant stream by event */
CREATE INDEX IF NOT EXISTS event_id ON "EventParticipantStream" ("eventId") WITH (fillfactor = 40);

/* Event room join request */
CREATE INDEX IF NOT EXISTS all_ids ON "EventRoomJoinRequest" ("conferenceId", "eventId", "attendeeId") INCLUDE ("approved") WITH (fillfactor = 40);

/* Invitation by invite code */
CREATE INDEX IF NOT EXISTS event_id ON "Invitation" ("inviteCode");

/* Transition by room */
CREATE INDEX IF NOT EXISTS room_id ON "Transitions" ("roomId");


/* Event specialisms */
CREATE INDEX IF NOT EXISTS intended_mode ON "Event" ("intendedRoomModeName");
CREATE INDEX IF NOT EXISTS events_in_range ON "Event" ("intendedRoomModeName", "endTime", "startTime");

/* Event vonage session by session id */
CREATE INDEX IF NOT EXISTS session_id ON "EventVonageSession" ("sessionId");

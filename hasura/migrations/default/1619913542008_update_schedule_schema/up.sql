ALTER TABLE "schedule"."Event"
    RENAME CONSTRAINT "Event_contentGroupId_fkey" to "Event_itemId_fkey";
ALTER TABLE "schedule"."Event"
    RENAME CONSTRAINT "Event_hallwayId_fkey" to "Event_exhibitionId_fkey";

ALTER INDEX "schedule"."event_conferenceId" RENAME TO "schedule_Event_conferenceId";
ALTER INDEX "schedule"."event_endTime" RENAME TO "schedule_Event_endTime";
ALTER INDEX "schedule"."event_events_in_range" RENAME TO "schedule_Event_EventsInRange";
ALTER INDEX "schedule"."event_group_id" RENAME TO "schedule_Event_GroupId";
ALTER INDEX "schedule"."event_intended_mode" RENAME TO "schedule_Event_IntendedMode";
ALTER INDEX "schedule"."event_room_id" RENAME TO "schedule_Event_roomId";
ALTER INDEX "schedule"."event_startTime_asc" RENAME TO "schedule_Event_startTime_asc";
ALTER INDEX "schedule"."event_startTime_desc" RENAME TO "schedule_Event_startTime_dsc";
DROP INDEX "schedule"."events_in_range";
DROP INDEX "schedule"."intended_mode";

ALTER TRIGGER "set_public_Event_updated_at" ON "schedule"."Event"
    RENAME TO "set_schedule_Event_updated_at";


ALTER TABLE "schedule"."EventProgramPerson"
    RENAME CONSTRAINT "EventPerson_eventId_fkey" to "EventProgramPerson_eventId_fkey";
ALTER TABLE "schedule"."EventProgramPerson"
    RENAME CONSTRAINT "EventPerson_personId_fkey" to "EventProgramPerson_personId_fkey";
ALTER TABLE "schedule"."EventProgramPerson"
    RENAME CONSTRAINT "EventPerson_roleName_fkey" to "EventProgramPerson_roleName_fkey";
ALTER TABLE "schedule"."EventProgramPerson"
    RENAME CONSTRAINT "EventPerson_pkey" to "EventProgramPerson_pkey";
ALTER TABLE "schedule"."EventProgramPerson"
    RENAME CONSTRAINT "EventPerson_eventId_personId_roleName_key" to "EventProgramPerson_eventId_personId_roleName_key";

DROP INDEX "schedule"."event_id";
ALTER INDEX "schedule"."eventperson_event_id" RENAME TO "schedule_EventProgramPerson_eventId";

ALTER TRIGGER "set_public_EventPerson_updated_at" ON "schedule"."EventProgramPerson"
    RENAME TO "set_schedule_EventPerson_updated_at";


ALTER TABLE "schedule"."EventProgramPersonRole"
    RENAME CONSTRAINT "EventPersonRole_pkey" to "EventProgramPersonRole_pkey";


ALTER TABLE "schedule"."EventRoomJoinRequest"
    RENAME CONSTRAINT "EventRoomJoinRequest_attendeeId_fkey" to "EventRoomJoinRequest_registrantId_fkey";
ALTER TABLE "schedule"."EventRoomJoinRequest"
    RENAME CONSTRAINT "EventRoomJoinRequest_eventPersonRoleName_fkey" to "EventRoomJoinRequest_eventProgramPersonRoleName_fkey";
ALTER TABLE "schedule"."EventRoomJoinRequest"
    RENAME CONSTRAINT "EventRoomJoinRequest_eventId_attendeeId_key" to "EventRoomJoinRequest_eventId_registrantId_key";

DROP INDEX "schedule"."all_ids";
DROP INDEX "schedule"."eventroomjoinrequest_all_ids";
CREATE INDEX "schedule_EventRoomJoinRequest_eventId" ON "schedule"."EventRoomJoinRequest" ("eventId");
CREATE INDEX "schedule_EventRoomJoinRequest_registrantId" ON "schedule"."EventRoomJoinRequest" ("registrantId");
CREATE INDEX "schedule_EventRoomJoinRequest_conferenceId" ON "schedule"."EventRoomJoinRequest" ("conferenceId");

ALTER TRIGGER "set_public_EventRoomJoinRequest_updated_at" ON "schedule"."EventRoomJoinRequest"
    RENAME TO "set_schedule_EventRoomJoinRequest_updated_at";

ALTER INDEX "schedule"."eventag_event_id" RENAME TO "schedule_EventTag_eventId";
CREATE INDEX "schedule_EventTag_tagId" ON "schedule"."EventTag" ("tagId");

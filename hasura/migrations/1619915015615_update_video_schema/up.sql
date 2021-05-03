ALTER TABLE "video"."BroadcastElement"
    RENAME CONSTRAINT "BroadcastContentItem_conferenceId_fkey" to "BroadcastElement_conferenceId_fkey";
ALTER TABLE "video"."BroadcastElement"
    RENAME CONSTRAINT "BroadcastContentItem_contentItemId_fkey" to "BroadcastElement_elementId_fkey";
ALTER TABLE "video"."BroadcastElement"
    RENAME CONSTRAINT "BroadcastContentItem_eventId_fkey" to "BroadcastElement_eventId_fkey";
ALTER TABLE "video"."BroadcastElement"
    RENAME CONSTRAINT "BroadcastContentItem_inputTypeName_fkey" to "BroadcastElement_inputTypeName_fkey";
ALTER TABLE "video"."BroadcastElement"
    RENAME CONSTRAINT "BroadcastContentItem_pkey" to "BroadcastElement_pkey";
ALTER TABLE "video"."BroadcastElement"
    RENAME CONSTRAINT "BroadcastContentItem_contentItemId_key" to "BroadcastElement_elementId_key";
ALTER TABLE "video"."BroadcastElement"
    RENAME CONSTRAINT "BroadcastContentItem_eventId_key" to "BroadcastElement_eventId_key";

ALTER TRIGGER "set_public_BroadcastContentItem_updated_at" ON "video"."BroadcastElement"
    RENAME TO "set_video_BroadcastElement_updated_at";

CREATE INDEX "video_BroadcastElement_elementId" ON "video"."BroadcastElement" ("elementId");
CREATE INDEX "video_BroadcastElement_conferenceId" ON "video"."BroadcastElement" ("conferenceId");
CREATE INDEX "video_BroadcastElement_eventId" ON "video"."BroadcastElement" ("eventId");



ALTER TABLE "video"."EventParticipantStream"
    RENAME CONSTRAINT "EventParticipantStream_attendeeId_fkey" to "EventParticipantStream_registrantId_fkey";
ALTER TABLE "video"."EventParticipantStream"
    RENAME CONSTRAINT "EventParticipantStream_eventId_attendeeId_vonageStreamId_key"
    to "EventParticipantStream_eventId_registrantId_vonageStreamId_key";

ALTER INDEX "video"."eventparticipantstream_event_id" RENAME TO "video_EventParticipantStream_eventId";
CREATE INDEX "video_EventParticipantStream_registrantId" ON "video"."EventParticipantStream" ("registrantId");
CREATE INDEX "video_EventParticipantStream_conferenceId" ON "video"."EventParticipantStream" ("conferenceId");
CREATE INDEX "video_EventParticipantStream_vonageConnectionId" ON "video"."EventParticipantStream" ("vonageConnectionId");
CREATE INDEX "video_EventParticipantStream_vonageStreamId" ON "video"."EventParticipantStream" ("vonageStreamId");

ALTER TRIGGER "set_public_EventParticipantStream_updated_at" ON "video"."EventParticipantStream"
    RENAME TO "set_video_EventParticipantStream_updated_at";


CREATE INDEX "video_EventVonageSession_conferenceId" ON "video"."EventVonageSession" ("conferenceId");
CREATE INDEX "video_EventVonageSession_eventId" ON "video"."EventVonageSession" ("eventId");
ALTER INDEX "video"."eventvonagesession_session_id" RENAME TO "video_EventVonageSession_sessionId";
DROP INDEX "video"."session_id";

ALTER TRIGGER "set_public_EventVonageSession_updated_at" ON "video"."EventVonageSession"
    RENAME TO "set_video_EventVonageSession_updated_at";


ALTER TRIGGER "set_public_MediaLiveChannel_updated_at" ON "video"."MediaLiveChannel"
    RENAME TO "set_video_MediaLiveChannel_updated_at";

CREATE INDEX "video_MediaLiveChannel_mediaLiveChannelId" ON "video"."MediaLiveChannel" ("mediaLiveChannelId");
CREATE INDEX "video_MediaLiveChannel_conferenceId" ON "video"."MediaLiveChannel" ("conferenceId");
CREATE INDEX "video_MediaLiveChannel_roomId" ON "video"."MediaLiveChannel" ("roomId");


ALTER TABLE "video"."TranscriptionJob"
    RENAME CONSTRAINT "TranscriptionJob_contentItemId_fkey" to "TranscriptionJob_elementId_fkey";

CREATE INDEX "video_TranscriptionJob_elementId" ON "video"."TranscriptionJob" ("elementId");
CREATE INDEX "video_TranscriptionJob_awsTranscribeJobName" ON "video"."TranscriptionJob" ("awsTranscribeJobName");

ALTER TRIGGER "set_public_TranscriptionJob_updated_at" ON "video"."TranscriptionJob"
    RENAME TO "set_video_TranscriptionJob_updated_at";



ALTER TABLE "video"."Transitions"
    RENAME CONSTRAINT "Transitions_broadcastContentId_fkey" to "Transitions_broadcastElementId_fkey";
ALTER TABLE "video"."Transitions"
    RENAME CONSTRAINT "Transitions_fallbackBroadcastContentId_fkey" to "Transitions_fallbackBroadcastElementId_fkey";

ALTER INDEX "video"."transitions_conference_id" RENAME TO "video_Transitions_conferenceId";
ALTER INDEX "video"."transitions_room_id" RENAME TO "video_Transitions_roomId";
CREATE INDEX "video_Transitions_broadcastElementId" ON "video"."Transitions" ("broadcastElementId");
CREATE INDEX "video_Transitions_fallbackBroadcastElementId" ON "video"."Transitions" ("fallbackBroadcastElementId");

ALTER TRIGGER "set_public_Transitions_updated_at" ON "video"."Transitions"
    RENAME TO "set_video_Transitions_updated_at";


ALTER TABLE "video"."VideoRenderJob"
    RENAME CONSTRAINT "VideoRenderJob_broadcastContentItemId_fkey" to "VideoRenderJob_broadcastElementId_fkey";

CREATE INDEX "video_VideoRenderJob_conferencePrepareJobId" ON "video"."VideoRenderJob" ("conferencePrepareJobId");
CREATE INDEX "video_VideoRenderJob_conferenceId" ON "video"."VideoRenderJob" ("conferenceId");
CREATE INDEX "video_VideoRenderJob_broadcastElementId" ON "video"."VideoRenderJob" ("broadcastElementId");

ALTER TRIGGER "set_public_VideoRenderJob_updated_at" ON "video"."VideoRenderJob"
    RENAME TO "set_video_VideoRenderJob_updated_at";


ALTER TABLE "video"."YouTubeUpload"
    RENAME CONSTRAINT "YouTubeUpload_contentItemId_fkey" to "YouTubeUpload_elementId_fkey";

ALTER TRIGGER "set_public_YouTubeUpload_updated_at" ON "video"."YouTubeUpload"
    RENAME TO "set_video_YouTubeUpload_updated_at";

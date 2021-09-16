import { gql } from "@apollo/client/core";
import { Content_ElementType_Enum, ElementBaseType, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import assert from "assert";
import { formatRFC7231 } from "date-fns";
import { validate as validateUUID } from "uuid";
import {
    AddVonageRoomRecordingToUserListDocument,
    CheckForVonageRoomRecordingAtEndTimeDocument,
    CheckForVonageRoomRecordingDocument,
    GetEventForArchiveDocument,
    InsertVonageArchiveElementDocument,
    Permissions_Permission_Enum,
    Room_Mode_Enum,
    SaveVonageRoomRecordingDocument,
    Vonage_GetEventDetailsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getRegistrantWithPermissions } from "../lib/authorisation";
import { canUserJoinRoom, getRoomConferenceId, getRoomVonageMeeting as getRoomVonageSession } from "../lib/room";
import {
    addAndRemoveEventParticipantStreams,
    addAndRemoveRoomParticipants,
    startArchiveIfOngoingEvent,
    startBroadcastIfOngoingEvent,
    stopArchiveIfNoOngoingEvent,
} from "../lib/vonage/sessionMonitoring";
import Vonage from "../lib/vonage/vonageClient";
import {
    ArchiveMonitoringWebhookReqBody,
    CustomConnectionData,
    SessionMonitoringWebhookReqBody,
} from "../types/vonage";

gql`
    query OngoingBroadcastableVideoRoomEvents($time: timestamptz!, $sessionId: String!) {
        schedule_Event(
            where: {
                eventVonageSession: { sessionId: { _eq: $sessionId } }
                intendedRoomModeName: { _in: [Q_AND_A, PRESENTATION] }
                endTime: { _gt: $time }
                startTime: { _lte: $time }
            }
        ) {
            id
        }
    }

    query OngoingArchivableVideoRoomEvents($time: timestamptz!, $sessionId: String!) {
        schedule_Event(
            where: {
                room: { publicVonageSessionId: { _eq: $sessionId } }
                intendedRoomModeName: { _eq: VIDEO_CHAT }
                endTime: { _gt: $time }
                startTime: { _lte: $time }
            }
        ) {
            id
            roomId
        }
    }
`;

export async function handleVonageSessionMonitoringWebhook(payload: SessionMonitoringWebhookReqBody): Promise<boolean> {
    let success = true;

    try {
        if (payload.event === "connectionCreated" || payload.event === "streamCreated") {
            success &&= await startBroadcastIfOngoingEvent(payload);
        }
    } catch (e) {
        console.error("Error while starting broadcast if ongoing event", e);
        success = false;
    }

    try {
        if (payload.event === "connectionCreated" || payload.event === "streamCreated") {
            success &&= await startArchiveIfOngoingEvent(payload);
        } else if (payload.event === "connectionDestroyed") {
            success &&= await stopArchiveIfNoOngoingEvent(payload);
        }
    } catch (e) {
        console.error("Error while starting or stopping archive of any ongoing event", e);
        success = false;
    }

    try {
        success &&= await addAndRemoveRoomParticipants(payload);
    } catch (e) {
        console.error("Error while adding/removing room participants", e);
        success = false;
    }

    try {
        success &&= await addAndRemoveEventParticipantStreams(payload);
    } catch (e) {
        console.error("Error while adding/removing event participant streams", e);
        success = false;
    }

    return success;
}

gql`
    query GetEventForArchive($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            id
            name
            startTime
            conferenceId
            item {
                id
                elements_aggregate {
                    aggregate {
                        count
                    }
                }
            }
        }
    }

    mutation InsertVonageArchiveElement($object: content_Element_insert_input!) {
        insert_content_Element_one(object: $object) {
            id
        }
    }

    query CheckForVonageRoomRecording($roomId: uuid!, $vonageSessionId: String!) {
        video_VonageRoomRecording(
            where: {
                roomId: { _eq: $roomId }
                vonageSessionId: { _eq: $vonageSessionId }
                endedAt: { _is_null: true }
                s3Url: { _is_null: true }
            }
        ) {
            id
        }
    }

    query CheckForVonageRoomRecordingAtEndTime($roomId: uuid!, $vonageSessionId: String!, $endedAt: timestamptz!) {
        video_VonageRoomRecording(
            where: {
                roomId: { _eq: $roomId }
                vonageSessionId: { _eq: $vonageSessionId }
                endedAt: { _eq: $endedAt }
                s3Url: { _is_null: true }
            }
        ) {
            id
        }
    }

    mutation SaveVonageRoomRecording($id: uuid!, $endedAt: timestamptz!, $s3Url: String) {
        update_video_VonageRoomRecording_by_pk(pk_columns: { id: $id }, _set: { endedAt: $endedAt, s3Url: $s3Url }) {
            id
        }
    }
`;

export async function handleVonageArchiveMonitoringWebhook(payload: ArchiveMonitoringWebhookReqBody): Promise<boolean> {
    // console.log("Vonage archive monitoring webhook payload", roomId, eventId, payload);
    const nameParts = payload.name.split("/");
    const roomId = nameParts[0];
    const eventId = nameParts[1];

    if (!roomId || !validateUUID(roomId)) {
        throw new Error(`Room Id is not valid: ${roomId}`);
    }

    if (payload.status === "uploaded") {
        assert(process.env.AWS_CONTENT_BUCKET_ID, "AWS_CONTENT_BUCKET_ID environment variable missing!");
        const s3Url = `s3://${process.env.AWS_CONTENT_BUCKET_ID}/${payload.partnerId}/${payload.id}/archive.mp4`;

        const endedAt = new Date(payload.createdAt + 1000 * payload.duration).toISOString();

        // Always try to save the recording into our Vonage Room Recording table
        // (This is also what enables users to access the list of recordings they've participated in)
        let response = await apolloClient.query({
            query: CheckForVonageRoomRecordingAtEndTimeDocument,
            variables: {
                roomId,
                vonageSessionId: payload.sessionId,
                endedAt,
            },
        });

        if (response.data.video_VonageRoomRecording.length === 0) {
            // Uploaded may occur before stopped for short recordings (according to Vonage docs)
            // so let's just check in case an unterminated Vonage recording is available
            response = await apolloClient.query({
                query: CheckForVonageRoomRecordingDocument,
                variables: {
                    roomId,
                    vonageSessionId: payload.sessionId,
                },
            });
        }

        if (response.data.video_VonageRoomRecording.length > 0) {
            const recording = response.data.video_VonageRoomRecording[0];
            await apolloClient.mutate({
                mutation: SaveVonageRoomRecordingDocument,
                variables: {
                    id: recording.id,
                    endedAt,
                    s3Url,
                },
            });
        }

        // Try to save the recording into a content item too?
        if (eventId) {
            if (!validateUUID(eventId)) {
                throw new Error(`Event Id is not valid: ${eventId}`);
            }

            const eventResponse = await apolloClient.query({
                query: GetEventForArchiveDocument,
                variables: {
                    eventId,
                },
            });

            if (!eventResponse.data?.schedule_Event_by_pk) {
                console.error("Could not find event for Vonage archive", {
                    roomId,
                    eventId,
                    sessionId: payload.sessionId,
                    archiveId: payload.id,
                });
                return false;
            }

            const event = eventResponse.data.schedule_Event_by_pk;

            if (!event.item) {
                console.log("Nowhere to store event Vonage archive", {
                    roomId,
                    eventId,
                    sessionId: payload.sessionId,
                    archiveId: payload.id,
                });
                return true;
            }

            const data: ElementDataBlob = [
                {
                    createdAt: Date.now(),
                    createdBy: "system",
                    data: {
                        baseType: ElementBaseType.Video,
                        type: Content_ElementType_Enum.VideoFile,
                        s3Url,
                        subtitles: {},
                    },
                },
            ];
            const layoutData: LayoutDataBlob = {
                contentType: Content_ElementType_Enum.VideoFile,
                hidden: false,
                wide: true,
                priority: event.item.elements_aggregate.aggregate?.count ?? 0,
            };

            const startTime = formatRFC7231(Date.parse(event.startTime));
            try {
                await apolloClient.mutate({
                    mutation: InsertVonageArchiveElementDocument,
                    variables: {
                        object: {
                            conferenceId: event.conferenceId,
                            data,
                            isHidden: false,
                            itemId: event.item.id,
                            layoutData,
                            name: `Recording of ${event.name} from ${startTime}`,
                            typeName: Content_ElementType_Enum.VideoFile,
                            uploadsRemaining: 0,
                        },
                    },
                });
            } catch (e) {
                console.error("Failed to store event Vonage archive", {
                    roomId,
                    eventId,
                    sessionId: payload.sessionId,
                    archiveId: payload.id,
                    error: e,
                });
                return false;
            }
        }
    } else if (payload.status === "failed" || payload.status === "stopped") {
        if (payload.status === "failed") {
            console.error("Vonage archive failed", payload);
        } else {
            console.info("Vonage archive stopped", { sessionId: payload.sessionId });
        }

        const response = await apolloClient.query({
            query: CheckForVonageRoomRecordingDocument,
            variables: {
                roomId,
                vonageSessionId: payload.sessionId,
            },
        });

        if (response.data.video_VonageRoomRecording.length > 0) {
            const endedAt = new Date(payload.createdAt + 1000 * payload.duration).toISOString();

            const recording = response.data.video_VonageRoomRecording[0];
            await apolloClient.mutate({
                mutation: SaveVonageRoomRecordingDocument,
                variables: {
                    id: recording.id,
                    endedAt,
                    s3Url: null,
                },
            });
        }

        // Yes, return true to the webhook handler
        // - we successfully handled the webhook,
        //   even if the recording itself failed
        return true;
    }

    return true;
}

gql`
    query Vonage_GetEventDetails($eventId: uuid!, $userId: String!) {
        schedule_Event_by_pk(id: $eventId) {
            conferenceId
            id
            intendedRoomModeName
            enableRecording
            eventVonageSession {
                id
                sessionId
            }
            room {
                id
                publicVonageSessionId
            }
            eventPeople(where: { person: { registrant: { userId: { _eq: $userId } } } }) {
                id
                roleName
            }
            conference {
                id
                registrants(where: { userId: { _eq: $userId } }) {
                    ...GetRegistrant_Registrant
                    groupRegistrants {
                        id
                        group {
                            id
                            groupRoles {
                                id
                                role {
                                    id
                                    rolePermissions {
                                        id
                                        permissionName
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

export async function handleJoinEvent(
    payload: joinEventVonageSessionArgs,
    userId: string
): Promise<JoinEventVonageSessionOutput> {
    const result = await apolloClient.query({
        query: Vonage_GetEventDetailsDocument,
        variables: {
            eventId: payload.eventId,
            userId,
        },
    });

    if (!result.data || !result.data.schedule_Event_by_pk || result.error) {
        console.error("Could not retrieve event information", payload.eventId);
        return {};
    }

    const vonageSessionId =
        result.data.schedule_Event_by_pk.intendedRoomModeName === Room_Mode_Enum.Presentation ||
        result.data.schedule_Event_by_pk.intendedRoomModeName === Room_Mode_Enum.QAndA ||
        result.data.schedule_Event_by_pk.intendedRoomModeName === Room_Mode_Enum.Prerecorded
            ? result.data.schedule_Event_by_pk.eventVonageSession?.sessionId
            : result.data.schedule_Event_by_pk.room.publicVonageSessionId;
    if (!vonageSessionId) {
        console.error("Could not retrieve Vonage session associated with event", payload.eventId);
        return {};
    }

    if (!result.data.schedule_Event_by_pk.conference.registrants.length) {
        console.error(
            "User does not have registrant at conference, refusing event join token",
            userId,
            payload.eventId
        );
        return {};
    }

    const registrant = result.data.schedule_Event_by_pk.conference.registrants[0];
    const isChairOrConferenceOrganizerOrConferenceModerator =
        result.data.schedule_Event_by_pk.eventPeople.some(
            (eventPerson) =>
                eventPerson.roleName.toUpperCase() === "CHAIR" ||
                eventPerson.roleName.toUpperCase() === "SESSION ORGANIZER" ||
                eventPerson.roleName.toUpperCase() === "ORGANIZER"
        ) ||
        result.data.schedule_Event_by_pk.conference.registrants[0].groupRegistrants.some((groupRegistrant) =>
            groupRegistrant.group.groupRoles.some((groupRole) =>
                groupRole.role.rolePermissions.some(
                    (rolePermission) =>
                        rolePermission.permissionName === Permissions_Permission_Enum.ConferenceManageAttendees ||
                        rolePermission.permissionName === Permissions_Permission_Enum.ConferenceManageGroups ||
                        rolePermission.permissionName === Permissions_Permission_Enum.ConferenceManageRoles ||
                        rolePermission.permissionName === Permissions_Permission_Enum.ConferenceManageSchedule ||
                        rolePermission.permissionName === Permissions_Permission_Enum.ConferenceModerateAttendees
                )
            )
        );
    const connectionData: CustomConnectionData = {
        registrantId: registrant.id,
        userId,
    };

    try {
        const accessToken = Vonage.vonage.generateToken(vonageSessionId, {
            data: JSON.stringify(connectionData),
            role: isChairOrConferenceOrganizerOrConferenceModerator ? "moderator" : "publisher",
        });

        const recordingId = await addRegistrantToVonageRecording(
            result.data.schedule_Event_by_pk.room.id,
            vonageSessionId,
            registrant.id
        ).catch((error) => {
            console.error("Error adding Vonage recording to user's list", { userId, payload, error });
        });

        return { accessToken, isRecorded: !!recordingId || result.data.schedule_Event_by_pk.enableRecording };
    } catch (e) {
        console.error("Failure while generating event Vonage session token", payload.eventId, vonageSessionId, e);
    }

    return {};
}

gql`
    query GetRoomThatUserCanJoin($roomId: uuid, $userId: String) {
        room_Room_by_pk(id: { _eq: $roomId }) {
            id
            publicVonageSessionId
        }
    }
`;

export async function handleJoinRoom(
    payload: joinRoomVonageSessionArgs,
    userId: string
): Promise<JoinRoomVonageSessionOutput> {
    const roomConferenceId = await getRoomConferenceId(payload.roomId);
    const registrant = await getRegistrantWithPermissions(userId, roomConferenceId);
    const canJoinRoom = await canUserJoinRoom(registrant.id, payload.roomId, roomConferenceId);

    if (!canJoinRoom) {
        console.warn("User tried to join a Vonage room, but was not permitted", { payload, userId });
        throw new Error("User is not permitted to join this room");
    }

    const maybeVonageMeetingId = await getRoomVonageSession(payload.roomId);

    if (!maybeVonageMeetingId) {
        console.error("Could not get Vonage meeting id", { payload, userId, registrantId: registrant.id });
        return {
            message: "Could not find meeting",
        };
    }

    const connectionData: CustomConnectionData = {
        registrantId: registrant.id,
        userId,
    };

    const isConferenceOrganizerOrConferenceModerator = registrant.groupRegistrants.some((groupRegistrant) =>
        groupRegistrant.group.groupRoles.some((groupRole) =>
            groupRole.role.rolePermissions.some(
                (rolePermission) =>
                    rolePermission.permissionName === Permissions_Permission_Enum.ConferenceManageAttendees ||
                    rolePermission.permissionName === Permissions_Permission_Enum.ConferenceManageGroups ||
                    rolePermission.permissionName === Permissions_Permission_Enum.ConferenceManageRoles ||
                    rolePermission.permissionName === Permissions_Permission_Enum.ConferenceManageSchedule ||
                    rolePermission.permissionName === Permissions_Permission_Enum.ConferenceModerateAttendees
            )
        )
    );

    const accessToken = Vonage.vonage.generateToken(maybeVonageMeetingId, {
        data: JSON.stringify(connectionData),
        role: isConferenceOrganizerOrConferenceModerator ? "moderator" : "publisher",
    });

    const recordingId = await addRegistrantToVonageRecording(payload.roomId, maybeVonageMeetingId, registrant.id).catch(
        (error) => {
            console.error("Error adding Vonage recording to user's list", { userId, payload, error });
        }
    );

    return {
        accessToken,
        sessionId: maybeVonageMeetingId,
        isRecorded: !!recordingId,
    };
}

gql`
    mutation AddVonageRoomRecordingToUserList($recordingId: uuid!, $registrantId: uuid!) {
        insert_registrant_SavedVonageRoomRecording_one(
            object: { isHidden: false, recordingId: $recordingId, registrantId: $registrantId }
            on_conflict: { constraint: SavedVonageRoomRecording_recordingId_registrantId_key, update_columns: [] }
        ) {
            id
        }
    }
`;

export async function addRegistrantToVonageRecording(
    roomId: string,
    vonageSessionId: string,
    registrantId: string
): Promise<string | null> {
    const response = await apolloClient.query({
        query: CheckForVonageRoomRecordingDocument,
        variables: {
            roomId,
            vonageSessionId,
        },
    });

    if (response.data.video_VonageRoomRecording.length > 0) {
        await apolloClient.mutate({
            mutation: AddVonageRoomRecordingToUserListDocument,
            variables: {
                recordingId: response.data.video_VonageRoomRecording[0].id,
                registrantId,
            },
        });

        return response.data.video_VonageRoomRecording[0].id;
    }

    return null;
}

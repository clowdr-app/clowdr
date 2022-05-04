import { gql } from "@apollo/client/core";
import type {
    joinEventVonageSessionArgs,
    JoinEventVonageSessionOutput,
    joinRoomVonageSessionArgs,
    JoinRoomVonageSessionOutput,
    toggleVonageRecordingStateArgs,
    ToggleVonageRecordingStateOutput,
} from "@midspace/hasura/action-types";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import { Content_ElementType_Enum, ElementBaseType } from "@midspace/shared-types/content";
import type { SourceBlob } from "@midspace/shared-types/content/element";
import { SourceType } from "@midspace/shared-types/content/element";
import type { LayoutDataBlob } from "@midspace/shared-types/content/layoutData";
import assert from "assert";
import { formatRFC7231 } from "date-fns";
import type { P } from "pino";
import { validate as validateUUID } from "uuid";
import {
    AddVonageRoomRecordingToUserListDocument,
    CheckForVonageRoomRecordingDocument,
    CheckForVonageRoomRecordingNotUploadedDocument,
    FindRoomByVonageSessionIdDocument,
    GetEventForArchiveDocument,
    InsertVonageArchiveElementDocument,
    Registrant_RegistrantRole_Enum,
    SaveVonageRoomRecordingDocument,
    Schedule_EventProgramPersonRole_Enum,
    Schedule_Mode_Enum,
    VonageJoinRoom_GetInfoDocument,
    Vonage_GetEventDetailsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getRegistrantDetails } from "../lib/authorisation";
import { BadRequestError, ForbiddenError, NotFoundError, ServerError } from "../lib/errors";
import { getRoomVonageMeeting as getRoomVonageSession } from "../lib/room";
import { getRoomParticipantsCount } from "../lib/roomParticipant";
import {
    addAndRemoveRoomParticipants,
    addAndRemoveVonageParticipantStreams,
    startArchiveIfOngoingEvent,
    startBroadcastIfOngoingEvent,
    startVonageArchive,
    stopArchiveIfNoOngoingEvent,
} from "../lib/vonage/sessionMonitoring";
import Vonage from "../lib/vonage/vonageClient";
import { stopRoomVonageArchiving } from "../lib/vonage/vonageTools";
import type {
    ArchiveMonitoringWebhookReqBody,
    CustomConnectionData,
    SessionMonitoringWebhookReqBody,
} from "../types/vonage";
import { callWithRetry } from "../utils";
import { getVideoChatNonEventRemainingQuota, incrementVideoChatNonEventUsage } from "./usage";

gql`
    query OngoingBroadcastableVideoRoomEvents($time: timestamptz!, $sessionId: String!) {
        schedule_Event(
            where: {
                eventVonageSession: { sessionId: { _eq: $sessionId } }
                modeName: { _eq: LIVESTREAM }
                scheduledEndTime: { _gt: $time }
                scheduledStartTime: { _lte: $time }
            }
        ) {
            id
        }
    }

    query OngoingArchivableVideoRoomEvents($time: timestamptz!, $sessionId: String!) {
        schedule_Event(
            where: {
                room: { publicVonageSessionId: { _eq: $sessionId } }
                modeName: { _eq: VIDEO_CHAT }
                scheduledEndTime: { _gt: $time }
                scheduledStartTime: { _lte: $time }
            }
        ) {
            id
            roomId
            enableRecording
        }
    }
`;

export async function handleVonageSessionMonitoringWebhook(
    logger: P.Logger,
    payload: SessionMonitoringWebhookReqBody
): Promise<boolean> {
    let success = true;

    try {
        if (payload.event === "connectionCreated" || payload.event === "streamCreated") {
            success &&= await startBroadcastIfOngoingEvent(logger, payload);
        }
    } catch (e: any) {
        logger.error({ err: e, sessionId: payload.sessionId }, "Error while starting broadcast if ongoing event");
        success = false;
    }

    try {
        if (payload.event === "connectionCreated" || payload.event === "streamCreated") {
            success &&= await startArchiveIfOngoingEvent(logger, payload);
        } else if (payload.event === "connectionDestroyed") {
            success &&= await stopArchiveIfNoOngoingEvent(logger, payload);
        }
    } catch (e: any) {
        logger.error(
            { err: e, sessionId: payload.sessionId },
            "Error while starting or stopping archive of any ongoing event"
        );
        success = false;
    }

    try {
        success &&= await addAndRemoveRoomParticipants(logger, payload);
    } catch (e: any) {
        logger.error({ err: e, sessionId: payload.sessionId }, "Error while adding/removing room participants");
        success = false;
    }

    try {
        success &&= await addAndRemoveVonageParticipantStreams(logger, payload);
    } catch (e: any) {
        logger.error({ err: e, sessionId: payload.sessionId }, "Error while adding/removing event participant streams");
        success = false;
    }

    return success;
}

gql`
    query GetEventForArchive($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            id
            name
            scheduledStartTime
            scheduledEndTime
            conferenceId
            subconferenceId
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

    query CheckForVonageRoomRecordingNotUploaded($roomId: uuid!, $vonageSessionId: String!) {
        video_VonageRoomRecording(
            where: {
                roomId: { _eq: $roomId }
                vonageSessionId: { _eq: $vonageSessionId }
                uploaded_at: { _is_null: true }
                s3Url: { _is_null: true }
            }
            order_by: { startedAt: desc }
        ) {
            id
        }
    }

    mutation SaveVonageRoomRecording($id: uuid!, $endedAt: timestamptz!, $uploadedAt: timestamptz, $s3Url: String) {
        update_video_VonageRoomRecording_by_pk(
            pk_columns: { id: $id }
            _set: { endedAt: $endedAt, uploaded_at: $uploadedAt, s3Url: $s3Url }
        ) {
            id
        }
    }
`;

export async function handleVonageArchiveMonitoringWebhook(
    logger: P.Logger,
    payload: ArchiveMonitoringWebhookReqBody
): Promise<boolean> {
    // logger.info("Vonage archive monitoring webhook payload", roomId, eventId, payload);
    const nameParts = payload.name.split("/");
    const roomId = nameParts[0];
    const eventId = nameParts[1];

    if (!roomId || !validateUUID(roomId)) {
        throw new Error(`Room Id is not valid: ${roomId}`);
    }

    if (payload.status === "uploaded") {
        if (payload.duration > 0) {
            assert(process.env.AWS_CONTENT_BUCKET_ID, "AWS_CONTENT_BUCKET_ID environment variable missing!");
            const s3Url = `s3://${process.env.AWS_CONTENT_BUCKET_ID}/${payload.partnerId}/${payload.id}/archive.mp4`;

            const endedAt = new Date(payload.createdAt + 1000 * payload.duration).toISOString();

            logger.info({ sessionId: payload.sessionId, endedAt, s3Url }, "Vonage archive uploaded");

            // Always try to save the recording into our Vonage Room Recording table
            // (This is also what enables users to access the list of recordings they've participated in)
            const response = await apolloClient.query({
                query: CheckForVonageRoomRecordingNotUploadedDocument,
                variables: {
                    roomId,
                    vonageSessionId: payload.sessionId,
                },
            });

            if (response.data.video_VonageRoomRecording.length > 0) {
                const recording0 = response.data.video_VonageRoomRecording[0];
                await apolloClient.mutate({
                    mutation: SaveVonageRoomRecordingDocument,
                    variables: {
                        id: recording0.id,
                        endedAt,
                        uploadedAt: new Date().toISOString(),
                        s3Url,
                    },
                });

                for (const recording of response.data.video_VonageRoomRecording.slice(1)) {
                    await apolloClient.mutate({
                        mutation: SaveVonageRoomRecordingDocument,
                        variables: {
                            id: recording.id,
                            endedAt,
                            uploadedAt: null,
                            s3Url: null,
                        },
                    });
                }
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
                    logger.error(
                        {
                            roomId,
                            eventId,
                            sessionId: payload.sessionId,
                            archiveId: payload.id,
                        },
                        "Could not find event for Vonage archive"
                    );
                    return false;
                }

                const event = eventResponse.data.schedule_Event_by_pk;

                if (!event.item) {
                    logger.info(
                        {
                            roomId,
                            eventId,
                            sessionId: payload.sessionId,
                            archiveId: payload.id,
                        },
                        "Nowhere to store event Vonage archive"
                    );
                    return true;
                }

                const source: SourceBlob = {
                    source: SourceType.EventRecording,
                    eventId: eventId,
                    startTimeMillis: Date.parse(event.scheduledStartTime),
                    durationSeconds: Math.round(
                        (Date.parse(event.scheduledEndTime) - Date.parse(event.scheduledStartTime)) / 1000
                    ),
                };

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
                    wide: true,
                    priority: event.item.elements_aggregate.aggregate?.count ?? 0,
                };

                const scheduledStartTime = formatRFC7231(Date.parse(event.scheduledStartTime));
                try {
                    await apolloClient.mutate({
                        mutation: InsertVonageArchiveElementDocument,
                        variables: {
                            object: {
                                conferenceId: event.conferenceId,
                                subconferenceId: event.subconferenceId,
                                data,
                                source,
                                isHidden: false,
                                itemId: event.item.id,
                                layoutData,
                                name: `Recording of ${event.name} from ${scheduledStartTime}`,
                                typeName: Content_ElementType_Enum.VideoFile,
                                uploadsRemaining: 0,
                            },
                        },
                    });
                } catch (e: any) {
                    logger.error(
                        {
                            roomId,
                            eventId,
                            sessionId: payload.sessionId,
                            archiveId: payload.id,
                            error: e,
                        },
                        "Failed to store event Vonage archive"
                    );
                    return false;
                }
            }
        }
    } else if (payload.status === "failed" || payload.status === "stopped") {
        const endedAt = new Date(payload.createdAt + 1000 * payload.duration).toISOString();

        if (payload.status === "failed") {
            logger.error({ payload }, "Vonage archive failed");
        } else {
            logger.info({ sessionId: payload.sessionId, endedAt }, "Vonage archive stopped");
        }

        if (payload.duration > 0) {
            const response = await apolloClient.query({
                query: CheckForVonageRoomRecordingDocument,
                variables: {
                    roomId,
                    vonageSessionId: payload.sessionId,
                },
            });

            if (response.data.video_VonageRoomRecording.length > 0) {
                for (const recording of response.data.video_VonageRoomRecording) {
                    await apolloClient.mutate({
                        mutation: SaveVonageRoomRecordingDocument,
                        variables: {
                            id: recording.id,
                            endedAt,
                            uploadedAt: null,
                            s3Url: null,
                        },
                    });
                }
            }
        }

        // Yes, return true to the webhook handler
        // - we successfully handled the webhook,
        //   even if the recording itself failed
        return true;
    }

    return true;
}

gql`
    query Vonage_GetEventDetails($eventId: uuid!, $registrantId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            conferenceId
            subconferenceId
            id
            modeName
            enableRecording
            scheduledStartTime
            scheduledEndTime
            eventVonageSession {
                id
                sessionId
            }
            room {
                id
                capacity
                publicVonageSessionId
            }
            eventPeople(where: { person: { registrantId: { _eq: $registrantId } } }) {
                id
                roleName
            }
        }
        registrant_Registrant_by_pk(id: $registrantId) {
            ...GetRegistrant_Registrant
        }
    }
`;

export async function handleJoinEvent(
    logger: P.Logger,
    payload: joinEventVonageSessionArgs,
    userId: string,
    allowedRegistrantIds: string[]
): Promise<JoinEventVonageSessionOutput> {
    if (!allowedRegistrantIds.includes(payload.registrantId)) {
        throw new ForbiddenError("Forbidden to join event room", {
            privateMessage: "Registrant is not in list of allowed registrants",
            privateErrorData: {
                registrantId: payload.registrantId,
                allowedRegistrantIds,
            },
        });
    }

    const result = await apolloClient.query({
        query: Vonage_GetEventDetailsDocument,
        variables: {
            eventId: payload.eventId,
            registrantId: payload.registrantId,
        },
    });

    if (!result.data?.schedule_Event_by_pk) {
        throw new NotFoundError("Event not found", { privateErrorData: { eventId: payload.eventId } });
    }

    if (result.data.schedule_Event_by_pk.modeName !== Schedule_Mode_Enum.Livestream) {
        const existingParticipantsCount = await getRoomParticipantsCount(result.data.schedule_Event_by_pk.room.id);
        if (
            result.data.schedule_Event_by_pk.room.capacity &&
            existingParticipantsCount >= result.data.schedule_Event_by_pk.room.capacity
        ) {
            throw new Error("The number of participants has reached the room's maximum capacity");
        }
    }

    const vonageSessionId =
        result.data.schedule_Event_by_pk.modeName === Schedule_Mode_Enum.Livestream
            ? result.data.schedule_Event_by_pk.eventVonageSession?.sessionId
            : result.data.schedule_Event_by_pk.room.publicVonageSessionId;
    if (!vonageSessionId) {
        throw new NotFoundError("Vonage session not found", { privateErrorData: { eventId: payload.eventId } });
    }

    if (result.data.registrant_Registrant_by_pk?.conferenceId !== result.data.schedule_Event_by_pk.conferenceId) {
        throw new BadRequestError("Invalid request", {
            privateMessage: "Registrant is not for same conference as event",
            privateErrorData: { eventId: payload.eventId, registrantId: payload.registrantId },
        });
    }

    if (
        result.data.schedule_Event_by_pk?.subconferenceId &&
        result.data.registrant_Registrant_by_pk?.conferenceRole !== Registrant_RegistrantRole_Enum.Organizer &&
        !result.data.registrant_Registrant_by_pk?.subconferenceMemberships.some(
            (x) => x.subconferenceId === result.data.schedule_Event_by_pk?.subconferenceId
        )
    ) {
        throw new BadRequestError("Invalid request", {
            privateMessage: "Registrant is not a member of the subconference for the event",
            privateErrorData: { eventId: payload.eventId, registrantId: payload.registrantId },
        });
    }

    const registrant = result.data.registrant_Registrant_by_pk;

    if (!registrant) {
        throw new NotFoundError("Registrant not found", {
            privateErrorData: { registrantId: payload.registrantId },
        });
    }

    // const isAlreadyParticipant = await getIsRoomParticipant(
    //     result.data.schedule_Event_by_pk.room.id,
    //     payload.registrantId
    // );
    // if (isAlreadyParticipant) {
    //     throw new Error(
    //         "You are already connected to this room, possibly from a different tab or device. If you recently left the room, please wait a minute before trying to rejoin."
    //     );
    // }

    if (Date.parse(result.data.schedule_Event_by_pk.scheduledStartTime) - 10 * 60 * 1000 > Date.now()) {
        const remainingQuota = await getVideoChatNonEventRemainingQuota(registrant.conferenceId);
        if (remainingQuota <= 0) {
            throw new Error("Quota limit reached (video-chat social minutes)");
        } else {
            await incrementVideoChatNonEventUsage(registrant.conferenceId, 1);
        }
    }

    const isPresenterOrChairOrConferenceOrganizerOrConferenceModerator =
        result.data.schedule_Event_by_pk.eventPeople.some(
            (eventPerson) =>
                eventPerson.roleName === Schedule_EventProgramPersonRole_Enum.Presenter ||
                eventPerson.roleName === Schedule_EventProgramPersonRole_Enum.Chair
        ) ||
        registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer ||
        registrant.conferenceRole === Registrant_RegistrantRole_Enum.Moderator ||
        (!!result.data.schedule_Event_by_pk.subconferenceId &&
            registrant.subconferenceMemberships.some(
                (x) =>
                    x.subconferenceId === result.data.schedule_Event_by_pk?.subconferenceId &&
                    (x.role === Registrant_RegistrantRole_Enum.Organizer ||
                        x.role === Registrant_RegistrantRole_Enum.Moderator)
            ));
    const connectionData: CustomConnectionData = {
        registrantId: registrant.id,
        userId,
    };

    try {
        const accessToken = Vonage.vonage.generateToken(vonageSessionId, {
            data: JSON.stringify(connectionData),
            role: isPresenterOrChairOrConferenceOrganizerOrConferenceModerator ? "moderator" : "publisher",
        });

        const recordingId = await addRegistrantToVonageRecording(
            result.data.schedule_Event_by_pk.room.id,
            vonageSessionId,
            registrant.id
        ).catch((error) => {
            logger.error({ userId, payload, err: error }, "Error adding Vonage recording to user's list");
        });

        return { accessToken, isRecorded: !!recordingId || result.data.schedule_Event_by_pk.enableRecording };
    } catch (err: unknown) {
        throw new ServerError("Server error", {
            privateMessage: "Failed to generate Vonage token",
            privateErrorData: {
                eventId: payload.eventId,
                registrantId: payload.registrantId,
            },
            originalError: err instanceof Error ? err : undefined,
        });
    }
}

gql`
    query VonageJoinRoom_GetInfo($roomId: uuid!, $registrantId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            id
            capacity
            subconferenceId
            item {
                id
                itemPeople(where: { person: { registrantId: { _eq: $registrantId } } }) {
                    id
                    roleName
                    personId
                }
            }
        }
    }
`;

export async function handleJoinRoom(
    logger: P.Logger,
    payload: joinRoomVonageSessionArgs,
    allowedRegistrantIds: string[],
    allowedRoomIds: string[],
    userId: string
): Promise<JoinRoomVonageSessionOutput> {
    // Guarantee: list of registrants will never include a registrant that does not have access
    // to a room in the list of rooms.
    if (!allowedRegistrantIds.includes(payload.registrantId)) {
        throw new ForbiddenError("Forbidden to join room", {
            privateMessage: "Registrant is not in list of allowed registrants",
            privateErrorData: {
                registrantId: payload.registrantId,
                allowedRegistrantIds,
            },
        });
    }

    if (!allowedRoomIds.includes(payload.roomId)) {
        throw new ForbiddenError("Forbidden to join room", {
            privateMessage: "Room is not in list of allowed rooms",
            privateErrorData: {
                roomId: payload.roomId,
                allowedRoomIds,
            },
        });
    }

    const sessionId = await getRoomVonageSession(payload.roomId);

    if (!sessionId) {
        throw new NotFoundError("Could not find Vonage session", {
            privateErrorData: {
                roomId: payload.roomId,
            },
        });
    }

    const registrant = await getRegistrantDetails(payload.registrantId);

    if (!registrant) {
        throw new NotFoundError("Registrant not found", {
            privateErrorData: {
                registrantId: payload.registrantId,
            },
        });
    }

    // const isAlreadyParticipant = await getIsRoomParticipant(payload.roomId, payload.registrantId);
    // if (isAlreadyParticipant) {
    //     throw new Error(
    //         "You are already connected to this room, possibly from a different tab or device. If you recently left the room, please wait a minute before trying to rejoin."
    //     );
    // }

    const remainingQuota = await getVideoChatNonEventRemainingQuota(registrant.conferenceId);
    if (remainingQuota <= 0) {
        throw new Error("Quota limit reached (video-chat social minutes)");
    } else {
        await incrementVideoChatNonEventUsage(registrant.conferenceId, 1);
    }

    const roomInfo = await apolloClient.query({
        query: VonageJoinRoom_GetInfoDocument,
        variables: {
            roomId: payload.roomId,
            registrantId: registrant.id,
        },
    });
    if (!roomInfo.data?.room_Room_by_pk) {
        logger.error("User tried to join a Vonage room, but the system could not retrieve the room information.", {
            payload,
            userId,
        });
        throw new Error("Failed to fetch room information");
    }

    if (
        roomInfo.data.room_Room_by_pk.subconferenceId &&
        registrant.conferenceRole !== Registrant_RegistrantRole_Enum.Organizer &&
        !registrant.subconferenceMemberships.some(
            (x) => x.subconferenceId === roomInfo.data.room_Room_by_pk?.subconferenceId
        )
    ) {
        throw new BadRequestError("Invalid request", {
            privateMessage: "Registrant is not a member of the subconference for the room",
            privateErrorData: {
                registrantId: payload.registrantId,
            },
        });
    }

    const existingParticipantsCount = await getRoomParticipantsCount(payload.roomId);
    if (roomInfo.data.room_Room_by_pk.capacity && existingParticipantsCount >= roomInfo.data.room_Room_by_pk.capacity) {
        throw new Error("The number of participants has reached the room's maximum capacity");
    }

    const connectionData: CustomConnectionData = {
        registrantId: payload.registrantId,
        userId,
    };

    const isPresenterOrChairOrConferenceOrganizerOrConferenceModerator =
        !!roomInfo.data.room_Room_by_pk.item?.itemPeople.some(
            (person) =>
                person.roleName.toUpperCase() === "AUTHOR" ||
                person.roleName.toUpperCase() === "PRESENTER" ||
                person.roleName.toUpperCase() === "CHAIR" ||
                person.roleName.toUpperCase() === "SESSION ORGANIZER" ||
                person.roleName.toUpperCase() === "ORGANIZER"
        ) ||
        registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer ||
        registrant.conferenceRole === Registrant_RegistrantRole_Enum.Moderator ||
        (!!roomInfo.data.room_Room_by_pk.subconferenceId &&
            registrant.subconferenceMemberships.some(
                (x) =>
                    x.subconferenceId === roomInfo.data.room_Room_by_pk?.subconferenceId &&
                    (x.role === Registrant_RegistrantRole_Enum.Organizer ||
                        x.role === Registrant_RegistrantRole_Enum.Moderator)
            ));
    const accessToken = Vonage.vonage.generateToken(sessionId, {
        data: JSON.stringify(connectionData),
        role: isPresenterOrChairOrConferenceOrganizerOrConferenceModerator ? "moderator" : "publisher",
    });

    const recordingId = await addRegistrantToVonageRecording(payload.roomId, sessionId, registrant.id).catch(
        (error) => {
            logger.error(
                { registrantId: registrant.id, payload, error },
                "Error adding Vonage recording to registrant's list"
            );
        }
    );

    return {
        accessToken,
        sessionId,
        isRecorded: Boolean(recordingId),
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

gql`
    query FindRoomByVonageSessionId($vonageSessionId: String!, $now: timestamptz!, $userId: String!) {
        room_Room(where: { publicVonageSessionId: { _eq: $vonageSessionId } }) {
            id
            subconferenceId
            events(where: { scheduledStartTime: { _lte: $now }, scheduledEndTime: { _gte: $now } }) {
                id
                eventPeople(
                    where: {
                        roleName: { _in: [CHAIR, PRESENTER] }
                        person: { registrant: { userId: { _eq: $userId } } }
                    }
                ) {
                    id
                }
            }
            conference {
                registrants(where: { userId: { _eq: $userId } }) {
                    id
                    conferenceRole
                    subconferenceMemberships {
                        id
                        subconferenceId
                        role
                    }
                }
            }
        }
    }
`;

export async function handleToggleVonageRecordingState(
    logger: P.Logger,
    args: toggleVonageRecordingStateArgs,
    userId: string
): Promise<ToggleVonageRecordingStateOutput> {
    const existingSessionArchives = await callWithRetry(
        async () =>
            await Vonage.listArchives({
                sessionId: args.vonageSessionId,
            })
    );
    assert(existingSessionArchives, "Could not obtain list of Vonage session archives.");

    const ongoingArchive = existingSessionArchives.some((x) => x.status === "started" || x.status === "paused");
    if (ongoingArchive !== args.recordingActive) {
        const response = await apolloClient.query({
            query: FindRoomByVonageSessionIdDocument,
            variables: {
                vonageSessionId: args.vonageSessionId,
                now: new Date().toISOString(),
                userId,
            },
        });

        if (!response.data.room_Room.length) {
            throw new Error("Could not find a room with the specified vonage session id.");
        }

        const room = response.data.room_Room[0];

        const registrantId = room.conference.registrants[0]?.id;
        if (!registrantId) {
            return {
                allowed: false,
                recordingState: ongoingArchive,
            };
        }

        const canToggle =
            room.events.length === 0 ||
            room.events.some((event) => event.eventPeople.length > 0) ||
            room.conference.registrants[0]?.conferenceRole === Registrant_RegistrantRole_Enum.Organizer ||
            Boolean(
                room.subconferenceId &&
                    room.conference.registrants[0]?.subconferenceMemberships.some(
                        (x) =>
                            x.subconferenceId === room.subconferenceId &&
                            x.role === Registrant_RegistrantRole_Enum.Organizer
                    )
            );
        if (!canToggle) {
            return {
                allowed: false,
                recordingState: ongoingArchive,
            };
        }

        const eventId = room.events[0]?.id;
        if (!ongoingArchive) {
            await startVonageArchive(logger, room.id, eventId, args.vonageSessionId, registrantId);
        } else {
            await stopRoomVonageArchiving(logger, room.id, eventId, true);
        }

        return {
            allowed: true,
            recordingState: !ongoingArchive,
        };
    } else {
        return {
            allowed: true,
            recordingState: ongoingArchive,
        };
    }
}

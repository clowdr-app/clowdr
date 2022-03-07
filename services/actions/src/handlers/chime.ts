import type { joinRoomChimeSessionArgs, JoinRoomChimeSessionOutput } from "@midspace/hasura/action-types";
import type { P } from "pino";
import { addRegistrantToChimeMeeting } from "../lib/aws/chime";
import { ForbiddenError, ServerError } from "../lib/errors";
import { getRoomByChimeMeetingId, getRoomChimeMeeting } from "../lib/room";
import { deleteRoomChimeMeetingForRoom } from "../lib/roomChimeMeeting";
import { addRoomParticipant, removeRoomParticipant } from "../lib/roomParticipant";
import type { ChimeMeetingEndedDetail, ChimeRegistrantJoinedDetail, ChimeRegistrantLeftDetail } from "../types/chime";
import { callWithRetry } from "../utils";
import { getVideoChatNonEventRemainingQuota, incrementVideoChatNonEventUsage } from "./usage";

export async function handleJoinRoom(
    logger: P.Logger,
    payload: joinRoomChimeSessionArgs,
    allowedRegistrantIds: string[],
    allowedRoomIds: string[]
): Promise<JoinRoomChimeSessionOutput> {
    // Assumption: list of registrants will never include a registrant that does not have access
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

    const maybeChimeMeeting = await getRoomChimeMeeting(logger, payload.roomId);

    if (!maybeChimeMeeting.MeetingId) {
        throw new ServerError("Server erro", {
            privateMessage: "Could not get Chime meeting ID for room",
            privateErrorData: { roomId: payload.roomId },
        });
    }

    const chimeRegistrant = await addRegistrantToChimeMeeting(payload.registrantId, maybeChimeMeeting.MeetingId);

    const remainingQuota = await getVideoChatNonEventRemainingQuota(maybeChimeMeeting.conferenceId);
    if (remainingQuota <= 0) {
        throw new Error("Quota limit reached (video-chat social minutes)");
    } else {
        await incrementVideoChatNonEventUsage(maybeChimeMeeting.conferenceId, 1);
    }

    return {
        registrant: chimeRegistrant,
        meeting: maybeChimeMeeting,
    };
}

export async function handleChimeRegistrantJoinedNotification(
    logger: P.Logger,
    payload: ChimeRegistrantJoinedDetail
): Promise<void> {
    // todo: record the timestamp from the notification and only delete records if a new notification has a later timestamp
    const room = await callWithRetry(() => getRoomByChimeMeetingId(payload.meetingId));

    if (!room) {
        logger.info(
            {
                meetingId: payload.meetingId,
                registrantId: payload.externalUserId,
            },
            "No room matching this Chime meeting, skipping participant addition."
        );
        return;
    }

    await callWithRetry(async () =>
        addRoomParticipant(
            logger,
            room.roomId,
            room.conferenceId,
            { chimeRegistrantId: payload.registrantId, chimeMeetingId: payload.meetingId },
            payload.externalUserId
        )
    );
}

export async function handleChimeRegistrantLeftNotification(
    logger: P.Logger,
    payload: ChimeRegistrantLeftDetail
): Promise<void> {
    const room = await callWithRetry(() => getRoomByChimeMeetingId(payload.meetingId));

    if (!room) {
        logger.info(
            {
                meetingId: payload.meetingId,
                registrantId: payload.externalUserId,
            },
            "No room matching this Chime meeting, skipping participant removal."
        );
        return;
    }

    await callWithRetry(async () =>
        removeRoomParticipant(logger, room.roomId, room.conferenceId, payload.externalUserId, undefined, false)
    );
}

export async function handleChimeMeetingEndedNotification(
    logger: P.Logger,
    payload: ChimeMeetingEndedDetail
): Promise<void> {
    logger.info(
        {
            chimeMeetingId: payload.meetingId,
            roomId: payload.externalMeetingId,
        },
        "Handling notification that Chime meeting ended"
    );
    const count = await deleteRoomChimeMeetingForRoom(payload.externalMeetingId, payload.meetingId);
    logger.info(
        {
            chimeMeetingId: payload.meetingId,
            roomId: payload.externalMeetingId,
        },
        `Deleted records for ${count} ended Chime meeting(s)`
    );
}

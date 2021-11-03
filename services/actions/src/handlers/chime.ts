import type { joinRoomChimeSessionArgs, JoinRoomChimeSessionOutput } from "@midspace/hasura/actionTypes";
import { getRegistrant } from "../lib/authorisation";
import { addRegistrantToChimeMeeting } from "../lib/aws/chime";
import { canUserJoinRoom, getRoomByChimeMeetingId, getRoomChimeMeeting, getRoomConferenceId } from "../lib/room";
import { deleteRoomChimeMeetingForRoom } from "../lib/roomChimeMeeting";
import { addRoomParticipant, removeRoomParticipant } from "../lib/roomParticipant";
import type { ChimeMeetingEndedDetail, ChimeRegistrantJoinedDetail, ChimeRegistrantLeftDetail } from "../types/chime";
import { callWithRetry } from "../utils";

export async function handleJoinRoom(
    payload: joinRoomChimeSessionArgs,
    userId: string
): Promise<JoinRoomChimeSessionOutput> {
    const { conferenceId: roomConferenceId, subconferenceId: _roomSubconferenceId } = await getRoomConferenceId(
        payload.roomId
    );
    const registrant = await getRegistrant(userId, roomConferenceId);
    const canJoinRoom = await canUserJoinRoom(registrant.id, payload.roomId, roomConferenceId);

    if (!canJoinRoom) {
        console.warn("User tried to join a Chime room, but was not permitted", { payload, userId });
        throw new Error("User is not permitted to join this room");
    }

    const maybeChimeMeeting = await getRoomChimeMeeting(payload.roomId, roomConferenceId);

    if (!maybeChimeMeeting.MeetingId) {
        throw new Error("Could not get Chime meeting ID for room");
    }

    const chimeRegistrant = await addRegistrantToChimeMeeting(registrant.id, maybeChimeMeeting.MeetingId);

    return {
        registrant: chimeRegistrant,
        meeting: maybeChimeMeeting,
    };
}

export async function handleChimeRegistrantJoinedNotification(payload: ChimeRegistrantJoinedDetail): Promise<void> {
    // todo: record the timestamp from the notification and only delete records if a new notification has a later timestamp
    const room = await callWithRetry(() => getRoomByChimeMeetingId(payload.meetingId));

    if (!room) {
        console.log("No room matching this Chime meeting, skipping participant addition.", {
            meetingId: payload.meetingId,
            registrantId: payload.externalUserId,
        });
        return;
    }

    await callWithRetry(async () =>
        addRoomParticipant(
            room.roomId,
            room.conferenceId,
            { chimeRegistrantId: payload.registrantId },
            payload.externalUserId
        )
    );
}

export async function handleChimeRegistrantLeftNotification(payload: ChimeRegistrantLeftDetail): Promise<void> {
    const room = await callWithRetry(() => getRoomByChimeMeetingId(payload.meetingId));

    if (!room) {
        console.log("No room matching this Chime meeting, skipping participant removal.", {
            meetingId: payload.meetingId,
            registrantId: payload.externalUserId,
        });
        return;
    }

    await callWithRetry(async () => removeRoomParticipant(room.roomId, room.conferenceId, payload.externalUserId));
}

export async function handleChimeMeetingEndedNotification(payload: ChimeMeetingEndedDetail): Promise<void> {
    console.log("Handling notification that Chime meeting ended", {
        chimeMeetingId: payload.meetingId,
        roomId: payload.externalMeetingId,
    });
    const count = await deleteRoomChimeMeetingForRoom(payload.externalMeetingId, payload.meetingId);
    console.log(`Deleted records for ${count} ended Chime meeting(s)`, {
        chimeMeetingId: payload.meetingId,
        roomId: payload.externalMeetingId,
    });
}

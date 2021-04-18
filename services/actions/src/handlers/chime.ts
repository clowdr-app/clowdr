import { getAttendee } from "../lib/authorisation";
import { addAttendeeToChimeMeeting } from "../lib/aws/chime";
import { canUserJoinRoom, getRoomByChimeMeetingId, getRoomChimeMeeting, getRoomConferenceId } from "../lib/room";
import { deleteRoomChimeMeetingForRoom } from "../lib/roomChimeMeeting";
import { addRoomParticipant, removeRoomParticipant } from "../lib/roomParticipant";
import { ChimeAttendeeJoinedDetail, ChimeAttendeeLeftDetail, ChimeMeetingEndedDetail } from "../types/chime";
import { callWithRetry } from "../utils";

export async function handleJoinRoom(
    payload: joinRoomChimeSessionArgs,
    userId: string
): Promise<JoinRoomChimeSessionOutput> {
    const roomConferenceId = await getRoomConferenceId(payload.roomId);
    const attendee = await getAttendee(userId, roomConferenceId);
    const canJoinRoom = await canUserJoinRoom(attendee.id, payload.roomId, roomConferenceId);

    if (!canJoinRoom) {
        console.warn("User tried to join a Chime room, but was not permitted", { payload, userId });
        throw new Error("User is not permitted to join this room");
    }

    const maybeChimeMeeting = await getRoomChimeMeeting(payload.roomId, roomConferenceId);

    if (!maybeChimeMeeting.MeetingId) {
        throw new Error("Could not get Chime meeting ID for room");
    }

    const chimeAttendee = await addAttendeeToChimeMeeting(attendee.id, maybeChimeMeeting.MeetingId);

    return {
        attendee: chimeAttendee,
        meeting: maybeChimeMeeting,
    };
}

export async function handleChimeAttendeeJoinedNotification(payload: ChimeAttendeeJoinedDetail): Promise<void> {
    // todo: record the timestamp from the notification and only delete records if a new notification has a later timestamp
    const room = await callWithRetry(() => getRoomByChimeMeetingId(payload.meetingId));

    if (!room) {
        console.log("No room matching this Chime meeting, skipping participant addition.", {
            meetingId: payload.meetingId,
            attendeeId: payload.externalUserId,
        });
        return;
    }

    await callWithRetry(async () =>
        addRoomParticipant(
            room.roomId,
            room.conferenceId,
            { chimeAttendeeId: payload.attendeeId },
            payload.externalUserId
        )
    );
}

export async function handleChimeAttendeeLeftNotification(payload: ChimeAttendeeLeftDetail): Promise<void> {
    const room = await callWithRetry(() => getRoomByChimeMeetingId(payload.meetingId));

    if (!room) {
        console.log("No room matching this Chime meeting, skipping participant removal.", {
            meetingId: payload.meetingId,
            attendeeId: payload.externalUserId,
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

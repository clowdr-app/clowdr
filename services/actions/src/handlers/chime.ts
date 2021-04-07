import { getAttendee } from "../lib/authorisation";
import { addAttendeeToChimeMeeting } from "../lib/aws/chime";
import { canUserJoinRoom, getRoomChimeMeeting, getRoomConferenceId } from "../lib/room";

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

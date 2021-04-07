import { Attendee, Meeting } from "@aws-sdk/client-chime";
import { callWithRetry } from "../../utils";
import { getChimeClient } from "./awsClient";

export async function createChimeMeeting(roomId: string): Promise<Meeting> {
    const chime = await getChimeClient();

    const result = await chime.createMeeting({
        ExternalMeetingId: roomId,
        NotificationsConfiguration: {
            SnsTopicArn: "todo",
        },
        Tags: [{ Key: "environment", Value: process.env.AWS_PREFIX }],
        MediaRegion: process.env.AWS_REGION,
    });

    if (!result.Meeting) {
        throw new Error("Failed to create Chime meeting");
    }

    return result.Meeting;
}

export async function doesChimeMeetingExist(chimeMeetingId: string): Promise<boolean> {
    const chime = await getChimeClient();

    try {
        const meeting = await callWithRetry(async () =>
            chime.getMeeting({
                MeetingId: chimeMeetingId,
            })
        );
        return meeting.Meeting ? true : false;
    } catch (e) {
        return false;
    }
}

/**
 * Add an attendee to a Chime meeting and get the secret join token.
 * @param attendeeId Clowdr attendee ID to be added to the meeting.
 * @param chimeMeetingId External ID of the Chime meeting.
 * @returns Join token for the attendee.
 */
export async function addAttendeeToChimeMeeting(attendeeId: string, chimeMeetingId: string): Promise<Attendee> {
    const chime = await getChimeClient();

    const result = await callWithRetry(async () =>
        chime.createAttendee({
            ExternalUserId: attendeeId,
            MeetingId: chimeMeetingId,
        })
    );

    if (!result.Attendee) {
        throw new Error("Could not add attendee to Chime meeting");
    }

    return result.Attendee;
}

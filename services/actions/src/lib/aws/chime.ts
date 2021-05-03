import {
    Attendee,
    CreateAttendeeCommand,
    CreateMeetingCommand,
    GetMeetingCommand,
    Meeting,
} from "@aws-sdk/client-chime";
import { callWithRetry } from "../../utils";
import { Chime } from "./awsClient";

export async function createChimeMeeting(roomId: string): Promise<Meeting> {
    const query = new CreateMeetingCommand({
        ExternalMeetingId: roomId,
        Tags: [{ Key: "environment", Value: process.env.AWS_PREFIX }],
        MediaRegion: process.env.AWS_REGION,
    });

    const result = await Chime.send(query);

    if (!result.Meeting) {
        throw new Error("Failed to create Chime meeting");
    }

    return result.Meeting;
}

export async function doesChimeMeetingExist(chimeMeetingId: string): Promise<boolean> {
    try {
        const meeting = await callWithRetry(async () =>
            Chime.send(
                new GetMeetingCommand({
                    MeetingId: chimeMeetingId,
                })
            )
        );
        return meeting.Meeting ? true : false;
    } catch (e) {
        return false;
    }
}

/**
 * Add an registrant to a Chime meeting and get the secret join token.
 * @param registrantId Clowdr registrant ID to be added to the meeting.
 * @param chimeMeetingId External ID of the Chime meeting.
 * @returns Join token for the registrant.
 */
export async function addRegistrantToChimeMeeting(registrantId: string, chimeMeetingId: string): Promise<Attendee> {
    const result = await callWithRetry(async () =>
        Chime.send(
            new CreateAttendeeCommand({
                ExternalUserId: registrantId,
                MeetingId: chimeMeetingId,
            })
        )
    );

    if (!result.Attendee) {
        throw new Error("Could not add registrant to Chime meeting");
    }

    return result.Attendee;
}

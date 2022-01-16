import type { Attendee, Meeting } from "@aws-sdk/client-chime";
import { CreateAttendeeCommand, CreateMeetingCommand, GetMeetingCommand } from "@aws-sdk/client-chime";
import { callWithRetry } from "../../utils";
import { awsClient, Chime } from "./awsClient";

export async function createChimeMeeting(roomId: string): Promise<Meeting> {
    const query = new CreateMeetingCommand({
        ExternalMeetingId: roomId,
        Tags: [{ Key: "environment", Value: awsClient.prefix }],
        MediaRegion: awsClient.region,
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
    } catch (e: any) {
        return false;
    }
}

/**
 * Add an registrant to a Chime meeting and get the secret join token.
 * @param registrantId Midspace registrant ID to be added to the meeting.
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

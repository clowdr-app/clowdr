import assert from "assert";
import { createOAuth2Client } from "../lib/googleAuth";
import { AttendeeGoogleAccountData, Payload } from "../types/hasura/event";
import { callWithRetry } from "../utils";

export async function handleAttendeeGoogleAccountDeleted(payload: Payload<AttendeeGoogleAccountData>): Promise<void> {
    assert(payload.event.data.old, "Payload must contain old row data");
    const oldRow = payload.event.data.old;

    console.log("Revoking credentials for attendee Google account", oldRow.id);
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(oldRow.tokenData);
    await callWithRetry(() => oauth2Client.revokeCredentials());
    console.log("Revoked credentials for attendee Google account", oldRow.id);
    return;
}

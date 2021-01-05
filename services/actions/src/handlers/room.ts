import { gql } from "@apollo/client/core";
import assert from "assert";
import { SetRoomVonageSessionIdDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import * as Vonage from "../lib/vonage/vonageClient";
import { Payload, RoomData } from "../types/hasura/event";

export async function handleRoomCreated(payload: Payload<RoomData>): Promise<void> {
    assert(payload.event.data.new, "Expected new row data");

    await createRoomVonageSession(payload.event.data.new.id);
}

async function createRoomVonageSession(roomId: string): Promise<string> {
    const sessionResult = await Vonage.createSession({ mediaMode: "relayed" });

    if (!sessionResult) {
        throw new Error("No session ID returned from Vonage");
    }

    gql`
        mutation SetRoomVonageSessionId($roomId: uuid!, $sessionId: String!) {
            update_Room_by_pk(pk_columns: { id: $roomId }, _set: { publicVonageSessionId: $sessionId }) {
                id
            }
        }
    `;

    await apolloClient.mutate({
        mutation: SetRoomVonageSessionIdDocument,
        variables: {
            roomId: roomId,
            sessionId: sessionResult.sessionId,
        },
    });

    return sessionResult.sessionId;
}

import { Wrap, WrapItem } from "@chakra-ui/react";
import React from "react";
import { gql } from "urql";
import { ImmediateSwitch } from "./ImmediateSwitch";
import { LiveIndicator } from "./LiveIndicator";
import StreamPreview from "./StreamPreview";

gql`
    subscription GetVonageParticipantStreams($eventId: uuid!) {
        video_VonageParticipantStream(
            where: { eventVonageSession: { eventId: { _eq: $eventId } }, stopped_at: { _is_null: true } }
        ) {
            ...VonageParticipantStreamDetails
        }
    }

    fragment VonageParticipantStreamDetails on video_VonageParticipantStream {
        id
        registrant {
            id
            displayName
        }
        conferenceId
        vonageSessionId
        vonageStreamType
        vonageStreamId
        registrantId
    }
`;

export function BackstageControls(): JSX.Element {
    return (
        <Wrap>
            <WrapItem>
                <StreamPreview />
            </WrapItem>
            <WrapItem>
                <LiveIndicator />
            </WrapItem>
            <WrapItem maxW="25ch">
                <ImmediateSwitch />
            </WrapItem>
        </Wrap>
    );
}

import { Box, HStack } from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { gql } from "urql";
import type { RoomEventDetailsFragment } from "../../../../../../generated/graphql";
import { useVonageGlobalState } from "../../Vonage/VonageGlobalStateProvider";
import { ImmediateSwitch } from "./ImmediateSwitch";
import { LiveIndicator } from "./LiveIndicator";

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

export function BackstageControls({
    event,
    hlsUri,
}: {
    event: RoomEventDetailsFragment;
    hlsUri: string | undefined;
}): JSX.Element {
    const vonageGlobalState = useVonageGlobalState();
    const [isConnected, setIsConnected] = useState<boolean>(false);
    useEffect(() => {
        const unobserve = vonageGlobalState.IsConnected.subscribe((isConn) => {
            setIsConnected(isConn);
        });
        return () => {
            unobserve();
        };
    }, [vonageGlobalState]);

    const immediateSwitchControls = useMemo(
        () => (
            <Box maxW="30ch">
                <ImmediateSwitch event={event} />
            </Box>
        ),
        [event]
    );

    return (
        <>
            <LiveIndicator event={event} isConnected={isConnected} hlsUri={hlsUri} />
            <HStack flexWrap="wrap" w="100%" justifyContent="center" alignItems="flex-end" my={2}>
                {immediateSwitchControls}
            </HStack>
        </>
    );
}

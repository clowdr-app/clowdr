import { gql } from "@apollo/client";
import {
    Box,
    Button,
    HStack,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Portal,
    Spinner,
    Text,
    useTheme,
    VStack,
} from "@chakra-ui/react";
import { transparentize } from "@chakra-ui/theme-tools";
import React, { useEffect, useMemo, useState } from "react";
import {
    RoomEventDetailsFragment,
    useGetVonageParticipantStreamsSubscription,
} from "../../../../../../generated/graphql";
import { useRealTime } from "../../../../../Generic/useRealTime";
import useQueryErrorToast from "../../../../../GQL/useQueryErrorToast";
import { FAIcon } from "../../../../../Icons/FAIcon";
import { useVonageGlobalState } from "../../Vonage/VonageGlobalStateProvider";
import { ImmediateSwitch } from "./ImmediateSwitch";
import { LayoutControls } from "./LayoutControls";
import { LiveIndicator } from "./LiveIndicator";

gql`
    subscription GetVonageParticipantStreams($eventId: uuid!) {
        video_VonageParticipantStream(where: { eventVonageSession: { eventId: { _eq: $eventId } } }) {
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
    const startTime = useMemo(() => Date.parse(event.startTime), [event.startTime]);
    const endTime = useMemo(() => Date.parse(event.endTime), [event.endTime]);
    const realNow = useRealTime(1000);
    const now = realNow + 2000; // adjust for expected RTMP delay
    const live = now >= startTime && now <= endTime;
    const secondsUntilLive = (startTime - now) / 1000;
    const secondsUntilOffAir = (endTime - now) / 1000;

    const {
        data: streamsData,
        loading: streamsLoading,
        error: streamsError,
    } = useGetVonageParticipantStreamsSubscription({
        variables: {
            eventId: event.id,
        },
    });
    useQueryErrorToast(streamsError, true, "EventRoomControlBar:GetVonageParticipantStreams");

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

    const theme = useTheme();
    const broadcastPopover = useMemo(
        () => (
            <Popover isLazy>
                <PopoverTrigger>
                    <VStack>
                        <Button
                            aria-label="Chair/presenter controls"
                            title="Chair/presenter controls"
                            textAlign="center"
                            colorScheme="gray"
                            bgColor={transparentize("gray.200", 0.7)(theme)}
                            size="sm"
                            rightIcon={<FAIcon icon="chevron-circle-down" iconStyle="s" mr={2} />}
                        >
                            <FAIcon icon="cogs" iconStyle="s" mr={2} />
                            <Text>Stream layout</Text>
                        </Button>
                    </VStack>
                </PopoverTrigger>
                <Portal>
                    <Box zIndex="500" position="relative">
                        <PopoverContent>
                            <PopoverArrow />
                            <PopoverCloseButton />
                            <PopoverHeader>Chair controls</PopoverHeader>
                            <PopoverBody>
                                <Text fontSize="sm" mb={2}>
                                    Here you can control how the layout of video streams.
                                </Text>
                                {streamsError ? <>Error loading streams.</> : streamsLoading ? <Spinner /> : undefined}
                                <LayoutControls
                                    live={live}
                                    streams={streamsData?.video_VonageParticipantStream ?? null}
                                    vonageSessionId={event.eventVonageSession?.sessionId ?? null}
                                />
                            </PopoverBody>
                        </PopoverContent>
                    </Box>
                </Portal>
            </Popover>
        ),
        [
            event.eventVonageSession?.sessionId,
            live,
            streamsData?.video_VonageParticipantStream,
            streamsError,
            streamsLoading,
            theme,
        ]
    );

    const immediateSwitchControls = useMemo(
        () => (
            <Box maxW="30ch">
                <ImmediateSwitch live={live} secondsUntilOffAir={secondsUntilOffAir} eventId={event.id} />
            </Box>
        ),
        [event.id, live, secondsUntilOffAir]
    );

    return (
        <>
            <LiveIndicator
                live={live}
                secondsUntilLive={secondsUntilLive}
                secondsUntilOffAir={secondsUntilOffAir}
                now={now}
                eventId={event.id}
                isConnected={isConnected}
                hlsUri={hlsUri}
            />
            <HStack flexWrap="wrap" w="100%" justifyContent="center" alignItems="flex-end" my={2}>
                {immediateSwitchControls}
                {broadcastPopover}
            </HStack>
        </>
    );
}

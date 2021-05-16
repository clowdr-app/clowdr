import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Flex,
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
    useBreakpointValue,
    VStack,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { RoomEventDetailsFragment, useGetEventParticipantStreamsSubscription } from "../../../../../generated/graphql";
import { useRealTime } from "../../../../Generic/useRealTime";
import useQueryErrorToast from "../../../../GQL/useQueryErrorToast";
import { FAIcon } from "../../../../Icons/FAIcon";
import { BroadcastControlPanel } from "./BroadcastControlPanel";
import { ImmediateSwitch } from "./ImmediateSwitch";
import { LiveIndicator } from "./LiveIndicator";

export function EventRoomControlPanel({ event }: { event: RoomEventDetailsFragment }): JSX.Element {
    gql`
        subscription GetEventParticipantStreams($eventId: uuid!) {
            video_EventParticipantStream(where: { eventId: { _eq: $eventId } }) {
                ...EventParticipantStreamDetails
            }
        }

        fragment EventParticipantStreamDetails on video_EventParticipantStream {
            id
            registrant {
                id
                displayName
            }
            conferenceId
            eventId
            vonageStreamType
            vonageStreamId
            registrantId
        }
    `;

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
    } = useGetEventParticipantStreamsSubscription({
        variables: {
            eventId: event.id,
        },
    });
    useQueryErrorToast(streamsError, true, "EventRoomControlBar:GetEventParticipantStreams");

    const broadcastPopover = useMemo(
        () => (
            <Popover placement="auto-end" isLazy>
                <PopoverTrigger>
                    <VStack>
                        <Button
                            aria-label="Advanced broadcast controls"
                            title="Advanced broadcast controls"
                            textAlign="center"
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
                            <PopoverHeader>Broadcast controls</PopoverHeader>
                            <PopoverBody>
                                <Text fontSize="sm" mb={2}>
                                    Here you can control how the video streams from the backstage are laid out in the
                                    broadcast video.
                                </Text>
                                {streamsError ? <>Error loading streams.</> : streamsLoading ? <Spinner /> : undefined}
                                <BroadcastControlPanel
                                    live={live}
                                    streams={streamsData?.video_EventParticipantStream ?? null}
                                    eventVonageSessionId={event.eventVonageSession?.id ?? null}
                                />
                            </PopoverBody>
                        </PopoverContent>
                    </Box>
                </Portal>
            </Popover>
        ),
        [event.eventVonageSession?.id, live, streamsData?.video_EventParticipantStream, streamsError, streamsLoading]
    );

    const immediateSwitchControls = useMemo(
        () => (
            <Box maxW="30ch">
                <ImmediateSwitch live={live} secondsUntilOffAir={secondsUntilOffAir} eventId={event.id} />
            </Box>
        ),
        [event.id, live, secondsUntilOffAir]
    );

    const insertSpacer = useBreakpointValue([false, false, true]);
    return (
        <Flex w="100%" p={2} flexWrap="wrap" alignItems="center" justifyContent="space-between">
            {/* Add a spacer of equal width to the Broadcast Controls button, so that the time info is centered */}
            {insertSpacer ? <Box w={"10em"}>&nbsp;</Box> : <></>}
            <LiveIndicator
                live={live}
                secondsUntilLive={secondsUntilLive}
                secondsUntilOffAir={secondsUntilOffAir}
                now={now}
                eventId={event.id}
            />
            <VStack justifyContent="center" alignItems="flex-end" my={2}>
                {immediateSwitchControls}
                {broadcastPopover}
            </VStack>
        </Flex>
    );
}

import { gql } from "@apollo/client";
import { Box, HStack, Text, useRadio, useRadioGroup, UseRadioProps, useToast, VStack } from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
    RoomEventSummaryFragment,
    RoomMode_Enum,
    useGetBreakoutRoomFromEventQuery,
} from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import { useConference } from "../../useConference";

gql`
    query GetBreakoutRoomFromEvent($originatingEventId: uuid!) {
        Room(where: { originatingEventId: { _eq: $originatingEventId } }) {
            id
        }
    }
`;

export function EventEndControls({
    currentRoomEvent,
}: {
    currentRoomEvent: RoomEventSummaryFragment | null;
}): JSX.Element {
    const [eventId, setEventId] = useState<string | undefined>(currentRoomEvent?.id);
    const [choice, setChoice] = useState<"breakout" | "continue">("continue");
    const history = useHistory();
    const conference = useConference();
    const toast = useToast();

    useEffect(() => {
        if (
            !currentRoomEvent ||
            ![RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(currentRoomEvent.intendedRoomModeName)
        ) {
            setChoice("continue");
        }
    }, [currentRoomEvent]);

    const { refetch } = useGetBreakoutRoomFromEventQuery({
        skip: true
    });

    useEffect(() => {
        async function fn() {
            if (eventId && currentRoomEvent?.id !== eventId && choice === "breakout") {
                try {
                    const breakoutRoom = await refetch({ originatingEventId: eventId });

                    if (!breakoutRoom.data.Room || breakoutRoom.data.Room.length < 1) {
                        throw new Error("No matching room found");
                    }

                    history.push(`/conference/${conference.slug}/room/${breakoutRoom.data.Room[0].id}`);
                } catch (e) {
                    console.error("Error while moving to breakout room at end of event", currentRoomEvent?.id, e);
                    toast({
                        status: "error",
                        title: "Could not find breakout room to move to at end of the event",
                    });
                    return;
                }
            } else {
                setEventId(currentRoomEvent?.id);
            }
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoomEvent?.id]);

    return currentRoomEvent ? (
        <EventEndButtons currentRoomEvent={currentRoomEvent} choice={choice} onChange={setChoice} />
    ) : (
        <></>
    );
}

export function EventEndButtons({
    currentRoomEvent,
    choice,
    onChange,
}: {
    currentRoomEvent: RoomEventSummaryFragment;
    choice: "breakout" | "continue";
    onChange: (choice: "breakout" | "continue") => void;
}): JSX.Element {
    const [timeUntilEnd, setTimeUntilEnd] = useState<string>("");
    const computeTimeUntilEnd = useCallback(() => {
        const eventEnd = new Date(Date.parse(currentRoomEvent.endTime ?? new Date().toISOString()));
        setTimeUntilEnd(formatDistanceToNow(eventEnd, { includeSeconds: true }));
    }, [currentRoomEvent.endTime]);
    useEffect(() => computeTimeUntilEnd(), [computeTimeUntilEnd]);
    usePolling(computeTimeUntilEnd, 5000, true);

    const { getRootProps, getRadioProps } = useRadioGroup({
        name: "event_end_option",
        defaultValue: "continue",
        value: choice,
        onChange: (value) => {
            onChange(value === "breakout" ? "breakout" : "continue");
        },
    });

    const group = getRootProps();

    return (
        <VStack>
            <Text>Event ends in {timeUntilEnd}</Text>
            <HStack {...group}>
                <RadioCard key="continue" {...getRadioProps({ value: "continue" })}>
                    Continue to next event
                </RadioCard>
                <RadioCard key="breakout" {...getRadioProps({ value: "breakout" })}>
                    Join breakout
                </RadioCard>
            </HStack>
        </VStack>
    );
}

function RadioCard(props: UseRadioProps & { children?: React.ReactNode | React.ReactNodeArray }): JSX.Element {
    const { getInputProps, getCheckboxProps } = useRadio(props);

    const input = getInputProps();
    const checkbox = getCheckboxProps();

    return (
        <Box as="label">
            <input {...input} />
            <Box
                {...checkbox}
                cursor="pointer"
                borderWidth="1px"
                borderRadius="md"
                boxShadow="md"
                _checked={{
                    bg: "teal.600",
                    color: "white",
                    borderColor: "teal.600",
                }}
                _focus={{
                    boxShadow: "outline",
                }}
                px={5}
                py={3}
            >
                {props.children}
            </Box>
        </Box>
    );
}

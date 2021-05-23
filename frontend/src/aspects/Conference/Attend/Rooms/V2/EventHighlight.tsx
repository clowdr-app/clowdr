import { AspectRatio, Box, Spacer, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { RoomTile_EventFragment, Room_Mode_Enum } from "../../../../../generated/graphql";
import { FAIcon } from "../../../../Icons/FAIcon";

export default function EventHighlight({ event }: { event: RoomTile_EventFragment }): JSX.Element {
    return (
        <AspectRatio ratio={16 / 9} w="100%">
            <VStack bgColor="rgba(7,7,10,0.85)" color="gray.50" flexDir="column" pt={6} h="100%" overflow="hidden">
                <EventModeIcon mode={event.intendedRoomModeName} />
                <EventModeName mode={event.intendedRoomModeName} />
                <Spacer />
                <Box>
                    <Text>
                        Ends:{" "}
                        {new Date(event.endTime).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </Text>
                </Box>
                <Spacer />
                <Box>
                    <Text
                        overflowWrap="normal"
                        whiteSpace="normal"
                        fontSize="sm"
                        my={1}
                        px={4}
                        noOfLines={[2, 2, 2, 2, 3]}
                        overflow="hidden"
                        height={["5ex", "5ex", "5ex", "5ex", "7.5ex"]}
                    >
                        {event.name}
                        {event.item ? `: ${event.item.title}` : ""}
                        {!event.item && event.exhibition ? `: ${event.exhibition.name}` : ""}
                    </Text>
                </Box>
            </VStack>
        </AspectRatio>
    );
}

function EventModeIcon({ mode }: { mode: Room_Mode_Enum }): JSX.Element {
    const fontSize = "3xl";
    switch (mode) {
        case Room_Mode_Enum.Breakout:
            return <FAIcon iconStyle="s" icon="users" fontSize={fontSize} />;
        case Room_Mode_Enum.Exhibition:
            return <FAIcon iconStyle="s" icon="puzzle-piece" fontSize={fontSize} />;
        case Room_Mode_Enum.None:
            return <FAIcon iconStyle="s" icon="calendar" fontSize={fontSize} />;
        case Room_Mode_Enum.Prerecorded:
        case Room_Mode_Enum.Presentation:
        case Room_Mode_Enum.QAndA:
            return <FAIcon iconStyle="s" icon="broadcast-tower" fontSize={fontSize} color="red.400" />;
        case Room_Mode_Enum.Shuffle:
            return <FAIcon iconStyle="s" icon="random" fontSize={fontSize} />;
        case Room_Mode_Enum.VideoPlayer:
            return <FAIcon iconStyle="s" icon="video" fontSize={fontSize} />;
        case Room_Mode_Enum.Zoom:
            return <FAIcon iconStyle="s" icon="headset" fontSize={fontSize} />;
    }
}

function EventModeName({ mode }: { mode: Room_Mode_Enum }): JSX.Element {
    const fontSize = "sm";
    switch (mode) {
        case Room_Mode_Enum.Breakout:
            return (
                <Text fontSize={fontSize} fontStyle="italic">
                    Video-chat
                </Text>
            );
        case Room_Mode_Enum.Exhibition:
            return (
                <Text fontSize={fontSize} fontStyle="italic">
                    Exhibition
                </Text>
            );
        case Room_Mode_Enum.None:
            return <Text fontSize={fontSize} fontStyle="italic"></Text>;
        case Room_Mode_Enum.Prerecorded:
        case Room_Mode_Enum.Presentation:
        case Room_Mode_Enum.QAndA:
            return (
                <Text fontSize={fontSize} fontStyle="italic">
                    Live-stream ({mode === Room_Mode_Enum.QAndA ? "Q&A" : "Presentation"})
                </Text>
            );
        case Room_Mode_Enum.Shuffle:
            return (
                <Text fontSize={fontSize} fontStyle="italic">
                    Social
                </Text>
            );
        case Room_Mode_Enum.VideoPlayer:
            return (
                <Text fontSize={fontSize} fontStyle="italic">
                    Video
                </Text>
            );
        case Room_Mode_Enum.Zoom:
            return (
                <Text fontSize={fontSize} fontStyle="italic">
                    External video-call
                </Text>
            );
    }
}

import { AspectRatio, Box, Spacer, Text, Tooltip, VStack } from "@chakra-ui/react";
import { formatDuration, intervalToDuration } from "date-fns";
import React from "react";
import type { RoomTile_EventFragment} from "../../../../../generated/graphql";
import { Room_Mode_Enum } from "../../../../../generated/graphql";
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

export function EventModeIcon({
    mode,
    fontSize = "3xl",
    durationSeconds,
}: {
    mode: Room_Mode_Enum;
    fontSize?: string;
    durationSeconds?: number;
}): JSX.Element {
    const iconEl = (() => {
        switch (mode) {
            case Room_Mode_Enum.VideoChat:
                return <FAIcon iconStyle="s" icon="users" fontSize={fontSize} mb={1} />;
            case Room_Mode_Enum.Exhibition:
                return <FAIcon iconStyle="s" icon="puzzle-piece" fontSize={fontSize} mb={1} />;
            case Room_Mode_Enum.None:
                return <FAIcon iconStyle="s" icon="calendar" fontSize={fontSize} mb={1} />;
            case Room_Mode_Enum.Prerecorded:
            case Room_Mode_Enum.Presentation:
            case Room_Mode_Enum.QAndA:
                return <FAIcon iconStyle="s" icon="broadcast-tower" fontSize={fontSize} color="red.400" mb={1} />;
            case Room_Mode_Enum.Shuffle:
                return <FAIcon iconStyle="s" icon="random" fontSize={fontSize} mb={1} />;
            case Room_Mode_Enum.VideoPlayer:
                return <FAIcon iconStyle="s" icon="video" fontSize={fontSize} mb={1} />;
            case Room_Mode_Enum.Zoom:
                return <FAIcon iconStyle="s" icon="headset" fontSize={fontSize} mb={1} />;
        }
    })();

    return <Tooltip label={EventModeNameString(mode, durationSeconds)}>{iconEl}</Tooltip>;
}

function EventModeName({ mode }: { mode: Room_Mode_Enum }): JSX.Element {
    const fontSize = "sm";
    return (
        <Text fontSize={fontSize} fontStyle="italic">
            {EventModeNameString(mode)}
        </Text>
    );
}

function EventModeNameString(mode: Room_Mode_Enum, durationSeconds?: number): string {
    const durationStr = durationSeconds
        ? " for " +
          formatDuration(
              intervalToDuration({
                  start: 0,
                  end: durationSeconds * 1000,
              })
          )
        : "";

    let result = "";
    switch (mode) {
        case Room_Mode_Enum.VideoChat:
            result = "Video-chat";
            break;
        case Room_Mode_Enum.Exhibition:
            result = "Exhibition";
            break;
        case Room_Mode_Enum.None:
            result = "External";
            break;
        case Room_Mode_Enum.Prerecorded:
        case Room_Mode_Enum.Presentation:
        case Room_Mode_Enum.QAndA:
            result = `Live-stream (${
                mode === Room_Mode_Enum.Prerecorded ? "Video" : mode === Room_Mode_Enum.QAndA ? "Q&A" : "Presentation"
            })`;
            break;
        case Room_Mode_Enum.Shuffle:
            result = "Social";
            break;
        case Room_Mode_Enum.VideoPlayer:
            result = "Video";
            break;
        case Room_Mode_Enum.Zoom:
            result = "External video-call";
            break;
    }

    return result + durationStr;
}

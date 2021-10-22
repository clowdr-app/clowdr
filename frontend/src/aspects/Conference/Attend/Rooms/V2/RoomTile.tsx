import { AspectRatio, Box, Button, Center, Heading, Spinner, useColorModeValue, VStack } from "@chakra-ui/react";
import React from "react";
import { useHistory } from "react-router-dom";
import { gql } from "urql";
import { Room_ManagementMode_Enum, useRoomTile_GetRoomQuery } from "../../../../../generated/graphql";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useConference } from "../../../useConference";
import EventHighlight from "./EventHighlight";
import RoomPresenceGrid from "./RoomPresenceGrid";

gql`
    query RoomTile_GetRoom($roomId: uuid!, $withEvent: Boolean!, $eventId: uuid) {
        room_Room_by_pk(id: $roomId) {
            ...RoomTile_Room
        }
    }

    fragment RoomTile_Room on room_Room {
        id
        name
        managementModeName
        originatingItem {
            id
            title
        }
        events(where: { id: { _eq: $eventId } }) @include(if: $withEvent) {
            ...RoomTile_Event
        }
    }

    fragment RoomTile_Event on schedule_Event {
        id
        name
        intendedRoomModeName
        startTime
        endTime
        exhibition {
            id
            name
        }
        item {
            id
            title
        }
    }
`;

export default function RoomTile({ roomId, eventId }: { roomId: string; eventId?: string }): JSX.Element {
    const conference = useConference();
    const [response] = useRoomTile_GetRoomQuery({
        variables: {
            roomId,
            eventId,
            withEvent: !!eventId,
        },
    });
    const shadow = useColorModeValue("md", "light-md");
    const bgColour = useColorModeValue("gray.100", "gray.800");
    const history = useHistory();
    return (
        <Button
            as={VStack}
            h="auto"
            border="2px solid"
            borderColor="gray.400"
            boxShadow={shadow}
            bgColor={bgColour}
            borderRadius="xl"
            w="100%"
            cursor="pointer"
            spacing={2}
            px={0}
            py={0}
            overflow="hidden"
            onClick={() => {
                history.push(`${conferenceUrl}/room/${roomId}`);
            }}
            pos="relative"
        >
            {response.data?.room_Room_by_pk ? (
                <>
                    {response.data.room_Room_by_pk.managementModeName === Room_ManagementMode_Enum.Private ? (
                        <Box pos="absolute" top={1} right={2}>
                            <FAIcon iconStyle="s" icon="lock" />
                        </Box>
                    ) : undefined}
                    {response.data.room_Room_by_pk.events?.length ? (
                        <EventHighlight event={response.data.room_Room_by_pk.events[0]} />
                    ) : (
                        <Box></Box>
                    )}
                    <Heading px={4} as="h2" fontSize="lg" textAlign="left" w="100%" whiteSpace="normal">
                        {response.data.room_Room_by_pk.originatingItem?.title ?? response.data.room_Room_by_pk.name}
                    </Heading>
                    <RoomPresenceGrid roomId={roomId} />
                </>
            ) : (
                <AspectRatio ratio={16 / 9} w="100%">
                    <Center>
                        <Spinner label="Loading room information" />
                    </Center>
                </AspectRatio>
            )}
        </Button>
    );
}

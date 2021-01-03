import { gql } from "@apollo/client";
import {
    Box,
    Flex,
    Heading,
    Skeleton,
    SkeletonCircle,
    SkeletonText,
    useBreakpointValue,
    useColorModeValue,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Permission_Enum, RoomDetailsFragment, useGetRoomDetailsQuery } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useNoPrimaryMenuButtons } from "../../../Menu/usePrimaryMenuButtons";
import { VonageRoomStateProvider } from "../../../Vonage/useVonageRoom";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";
import VonageRoom from "./VonageRoom";

gql`
    query GetRoomDetails($roomId: uuid!, $eventsFrom: timestamptz!) {
        Room_by_pk(id: $roomId) {
            ...RoomDetails
        }
    }

    fragment RoomDetails on Room {
        id
        name
        currentModeName
        mediaLiveChannel {
            cloudFrontDomain
            endpointUri
            id
        }
        publicVonageSessionId
        ...RoomEvents
    }

    fragment RoomEvents on Room {
        events(where: { endTime: { _gt: $eventsFrom } }) {
            ...RoomEventDetails
        }
    }

    fragment RoomEventDetails on Event {
        id
        startTime
        name
        durationSeconds
        endTime
        intendedRoomModeName
        eventPeople {
            id
            roleName
            attendee {
                displayName
                id
                userId
            }
        }
    }
`;

export default function RoomPage({ roomId }: { roomId: string }): JSX.Element {
    // const [currentTime, setCurrentTime] = useState<string>(new Date().toISOString());
    const currentTime = useMemo(() => new Date().toISOString(), []);
    const result = useGetRoomDetailsQuery({
        variables: {
            roomId,
            eventsFrom: currentTime,
        },
    });

    usePolling(
        () => {
            //setCurrentTime(new Date().toISOString());
            result.refetch({ eventsFrom: new Date().toISOString() });
        },
        10000,
        true
    );

    // const hlsUri = useMemo(() => {
    //     if (!data?.Room || data.Room.length !== 1 || !data.Room[0].mediaLiveChannel) {
    //         return null;
    //     }

    //     const finalUri = new URL(data.Room[0].mediaLiveChannel.endpointUri);
    //     finalUri.hostname = data.Room[0].mediaLiveChannel.cloudFrontDomain;

    //     return finalUri.toString();
    // }, [data?.Room]);

    useNoPrimaryMenuButtons();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceView, Permission_Enum.ConferenceViewAttendees]}
        >
            <ApolloQueryWrapper getter={(data) => data.Room_by_pk} queryResult={result}>
                {(room: RoomDetailsFragment) => <Room roomDetails={room} />}
            </ApolloQueryWrapper>
        </RequireAtLeastOnePermissionWrapper>
    );
}

function Room({ roomDetails }: { roomDetails: RoomDetailsFragment }): JSX.Element {
    const currentRoomEvent = useCurrentRoomEvent(roomDetails);

    return currentRoomEvent ? <EventRoom roomDetails={roomDetails} /> : <BreakoutRoom roomDetails={roomDetails} />;
}

function BreakoutRoom({ roomDetails }: { roomDetails: RoomDetailsFragment }): JSX.Element {
    const backgroundColor = useColorModeValue("gray.50", "gray.900");
    const stackColumns = useBreakpointValue({ base: true, lg: false });
    return (
        <Flex width="100%" height="100%" gridColumnGap={5} flexWrap={stackColumns ? "wrap" : "nowrap"}>
            <Box textAlign="left" flexGrow={1} overflowY="auto" p={2}>
                <Box height="80vh" width="100%" background={backgroundColor}>
                    <VonageRoomStateProvider>
                        <VonageRoom roomId={roomDetails.id} />
                    </VonageRoomStateProvider>
                </Box>
                <Heading as="h2" textAlign="left" mt={5}>
                    {roomDetails.name}
                </Heading>
            </Box>
            <Box width={stackColumns ? "100%" : "30%"} border="1px solid white" height="100%">
                <SkeletonCircle size="20" />
                <SkeletonText mt={8} noOfLines={5} spacing={5} />
            </Box>
        </Flex>
    );
}

gql`
    mutation GetEventVonageToken($eventId: uuid!) {
        joinEventVonageSession(eventId: $eventId) {
            accessToken
        }
    }

    query GetEventVonageDetails($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
            eventVonageSession {
                sessionId
                id
            }
            id
        }
    }
`;

function EventRoom({ roomDetails }: { roomDetails: RoomDetailsFragment }): JSX.Element {
    return (
        <Flex width="100%" height="100%" gridColumnGap={5}>
            <Box textAlign="left" flexGrow={1} overflowY="auto" p={2}>
                <Skeleton height="80vh" width="100%"></Skeleton>
                <Heading as="h2" textAlign="left" mt={5}>
                    {roomDetails.name}
                </Heading>
            </Box>
            <Box width="30%" border="1px solid white" height="100%">
                <SkeletonCircle size="20" />
                <SkeletonText mt={8} noOfLines={5} spacing={5} />
            </Box>
        </Flex>
    );
}

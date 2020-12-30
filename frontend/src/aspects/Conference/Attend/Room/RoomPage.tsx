import { gql } from "@apollo/client";
import { Button, Heading, Spinner, Text, useToast } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import ReactPlayer from "react-player";
import {
    useGetEventVonageDetailsQuery,
    useGetEventVonageTokenMutation,
    useGetRoomDetailsQuery,
    useOngoingEventsInRoomQuery,
} from "../../../../generated/graphql";
import useUserId from "../../../Auth/useUserId";
import { useNoPrimaryMenuButtons } from "../../../Menu/usePrimaryMenuButtons";
import useOpenTok from "../../../Vonage/useOpenTok";
import { useConference } from "../../useConference";

gql`
    query GetRoomDetails($roomId: uuid!, $conferenceId: uuid!) {
        Room(where: { _and: { conferenceId: { _eq: $conferenceId } }, id: { _eq: $roomId } }) {
            id
            name
            currentModeName
            mediaLiveChannel {
                cloudFrontDomain
                endpointUri
                id
            }
        }
    }
`;

export default function RoomPage({ roomId }: { roomId: string }): JSX.Element {
    const conference = useConference();
    const { data, error, loading } = useGetRoomDetailsQuery({
        variables: {
            conferenceId: conference.id,
            roomId,
        },
    });

    const hlsUri = useMemo(() => {
        if (!data?.Room || data.Room.length !== 1 || !data.Room[0].mediaLiveChannel) {
            return null;
        }

        const finalUri = new URL(data.Room[0].mediaLiveChannel.endpointUri);
        finalUri.hostname = data.Room[0].mediaLiveChannel.cloudFrontDomain;

        return finalUri.toString();
    }, [data?.Room]);

    useNoPrimaryMenuButtons();

    return (
        <>
            {loading ? (
                <Spinner />
            ) : error || !data?.Room || data.Room.length === 0 ? (
                <Text>Could not load room. {error?.message} </Text>
            ) : (
                <>
                    <Heading as="h1">Welcome to {conference.shortName}!</Heading>
                    <Text>This is room {data.Room[0].name}.</Text>
                    {hlsUri ? <ReactPlayer url={hlsUri} controls={true} /> : <>No video.</>}
                </>
            )}
            <CurrentRoomEvent roomId={roomId} />
        </>
    );
}

gql`
    query OngoingEventsInRoom($time: timestamptz!, $roomId: uuid!, $userId: String!) {
        Event(where: { endTime: { _gt: $time }, startTime: { _lte: $time }, room: { id: { _eq: $roomId } } }) {
            ...CoreEventFields
            eventPeople(where: { attendee: { userId: { _eq: $userId } } }) {
                id
                roleName
            }
        }
    }

    fragment CoreEventFields on Event {
        id
        startTime
        name
        durationSeconds
        endTime
        intendedRoomModeName
    }
`;

function CurrentRoomEvent({ roomId }: { roomId: string }): JSX.Element {
    const [time, setTime] = useState<Date>(new Date());
    const userId = useUserId();
    const { data, error, loading } = useOngoingEventsInRoomQuery({
        variables: {
            roomId,
            time: time.toISOString(),
            userId: userId ?? "",
        },
    });

    return (
        <>
            {loading ? (
                <Spinner />
            ) : error ? (
                <>Error loading current room event</>
            ) : data?.Event && data.Event.length > 0 ? (
                <>
                    <Text>{data?.Event[0].name} </Text>
                    <Text>
                        {data?.Event[0].startTime} to {data?.Event[0].endTime}
                    </Text>
                    {data?.Event[0].eventPeople.length > 0 ? <EventRoom eventId={data.Event[0].id} /> : <></>}
                </>
            ) : (
                <Text>No current event.</Text>
            )}
        </>
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

function EventRoom({ eventId }: { eventId: string }): JSX.Element {
    const [openTokProps, openTokMethods] = useOpenTok();
    const toast = useToast();
    const { data, loading, error } = useGetEventVonageDetailsQuery({
        variables: {
            eventId,
        },
    });
    const [getEventVonageTokenMutation] = useGetEventVonageTokenMutation();

    return (
        <>
            <Text>Vonage room</Text>
            <div id="camera" style={{ width: 400, height: 400 }}></div>
            <Button
                onClick={async () => {
                    if (!data?.Event_by_pk?.eventVonageSession?.sessionId) {
                        toast({
                            status: "error",
                            description: "Haven't yet retrieved event session ID",
                        });
                        return;
                    }

                    const result = await getEventVonageTokenMutation({
                        variables: {
                            eventId,
                        },
                    });

                    if (result.data?.joinEventVonageSession?.accessToken) {
                        const session = await openTokMethods.initSession({
                            apiKey: import.meta.env.SNOWPACK_PUBLIC_OPENTOK_API_KEY,
                            sessionId: data.Event_by_pk.eventVonageSession.sessionId,
                            sessionOptions: {},
                        });
                        if (!session) {
                            toast({
                                status: "error",
                                description: "Session does not yet exist",
                            });
                            return;
                        }
                        await openTokMethods.connectSession(result.data.joinEventVonageSession.accessToken, session);
                        await openTokMethods.publish({
                            name: "camera",
                            element: "camera",
                            options: {},
                        });
                    } else {
                        toast({
                            status: "error",
                            description: "Failed to get token for joining the event",
                        });
                    }
                }}
            >
                Connect
            </Button>
            {openTokProps.isSessionConnected ? (
                <Button
                    onClick={() => {
                        openTokMethods.disconnectSession();
                    }}
                >
                    Disconnect
                </Button>
            ) : (
                <></>
            )}
        </>
    );
}

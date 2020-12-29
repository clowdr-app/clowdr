import { gql } from "@apollo/client";
import { Heading, Spinner, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import { useGetRoomDetailsQuery } from "../../../../generated/graphql";
import { useNoPrimaryMenuButtons } from "../../../Menu/usePrimaryMenuButtons";
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

export default function AttendeeLandingPage({ roomId }: { roomId: string }): JSX.Element {
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

    return loading ? (
        <Spinner />
    ) : error || !data?.Room || data.Room.length === 0 ? (
        <Text>Could not load room. {error?.message} </Text>
    ) : (
        <>
            <Heading as="h1">Welcome to {conference.shortName}!</Heading>
            <Text>This is room {data.Room[0].name}.</Text>
            {hlsUri ? <ReactPlayer url={hlsUri} controls={true} /> : <>No video.</>}
        </>
    );
}

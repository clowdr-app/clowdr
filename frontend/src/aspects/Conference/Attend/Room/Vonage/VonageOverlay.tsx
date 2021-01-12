import { gql } from "@apollo/client";
import { HStack, Image, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useVonageSubscriber_GetAttendeeQuery } from "../../../../../generated/graphql";
import { FAIcon } from "../../../../Icons/FAIcon";

gql`
    query VonageSubscriber_GetAttendee($id: uuid!) {
        Attendee_by_pk(id: $id) {
            id
            displayName
            profile {
                attendeeId
                photoURL_50x50
            }
        }
    }
`;

export function VonageOverlay({ connectionData }: { connectionData: string }): JSX.Element {
    const attendeeId = useMemo(() => {
        try {
            const data = JSON.parse(connectionData);
            return data["attendeeId"] ?? null;
        } catch (e) {
            console.warn("Couldn't parse attendee ID from Vonage subscriber data");
            return null;
        }
    }, [connectionData]);

    const { data } = useVonageSubscriber_GetAttendeeQuery({
        variables: {
            id: attendeeId,
        },
    });

    return (
        <HStack pr={2} bgColor="rgba(0,0,0,0.6)" borderRadius="sm" width="max-content">
            {data?.Attendee_by_pk?.profile?.photoURL_50x50 ? (
                <Image
                    borderRadius={5}
                    w="2rem"
                    h="auto"
                    objectFit="cover"
                    objectPosition="center"
                    src={data.Attendee_by_pk.profile.photoURL_50x50}
                    alt={`Profile picture of ${data.Attendee_by_pk.displayName}`}
                />
            ) : data?.Attendee_by_pk ? (
                <FAIcon ml={1} iconStyle="s" icon="cat" fontSize={"22px"} />
            ) : (
                <></>
            )}
            <Text>{data?.Attendee_by_pk?.displayName}</Text>
        </HStack>
    );
}

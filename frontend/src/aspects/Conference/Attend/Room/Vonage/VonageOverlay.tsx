import { gql } from "@apollo/client";
import { Button, HStack, Image, Text, useToast } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useVonageSubscriber_GetAttendeeQuery } from "../../../../../generated/graphql";
import { useChatProfileModal } from "../../../../Chat/Frame/ChatProfileModalProvider";
import { FAIcon } from "../../../../Icons/FAIcon";

gql`
    query VonageSubscriber_GetAttendee($id: uuid!) {
        Attendee_by_pk(id: $id) {
            ...AttendeeData
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
        fetchPolicy: "network-only",
    });
    const profileModal = useChatProfileModal();
    const toast = useToast();

    return (
        <Button
            minW="unset"
            minH="unset"
            h="auto"
            p={0}
            m="3px"
            size="xs"
            maxW="calc(100% - 6px - 0.8rem)"
            background="none"
            borderRadius={5}
            overflow="hidden"
            display="block"
            aria-label={`View ${data?.Attendee_by_pk?.displayName ?? "<Loading name>"}'s profile`}
            onClick={() => {
                if (data?.Attendee_by_pk?.profile) {
                    profileModal.open({
                        ...data.Attendee_by_pk,
                        profile: data.Attendee_by_pk.profile,
                    });
                } else {
                    toast({
                        status: "warning",
                        title: "Profile currently unavailable",
                        duration: 2000,
                    });
                }
            }}
        >
            <HStack pr={2} bgColor="rgba(0,0,0,0.6)" borderRadius="sm">
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
                <Text display="block" color={"gray.100"} noOfLines={1} width="100%">
                    {data?.Attendee_by_pk?.displayName ?? "<Loading name>"}
                </Text>
            </HStack>
        </Button>
    );
}

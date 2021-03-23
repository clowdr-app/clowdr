import { Button, HStack, Image, Text, useToast } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useChatProfileModal } from "../../../../Chat/Frame/ChatProfileModalProvider";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useAttendee } from "../../../AttendeesContext";

export function VonageOverlay({
    connectionData,
    microphoneEnabled,
}: {
    connectionData: string;
    microphoneEnabled?: boolean;
}): JSX.Element {
    const attendeeIdObj = useMemo(() => {
        try {
            const data = JSON.parse(connectionData);
            return data["attendeeId"] ? { attendee: data["attendeeId"] } : null;
        } catch (e) {
            console.warn("Couldn't parse attendee ID from Vonage subscriber data");
            return null;
        }
    }, [connectionData]);

    const attendee = useAttendee(attendeeIdObj);
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
            aria-label={`View ${attendee?.displayName ?? "<Loading name>"}'s profile`}
            onClick={() => {
                if (attendee && attendee.profile) {
                    profileModal.open({
                        ...attendee,
                        profile: attendee.profile,
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
                {attendee?.profile?.photoURL_50x50 ? (
                    <Image
                        borderRadius={5}
                        w="2rem"
                        h="auto"
                        objectFit="cover"
                        objectPosition="center"
                        src={attendee?.profile.photoURL_50x50}
                        alt={`Profile picture of ${attendee?.displayName}`}
                    />
                ) : attendee ? (
                    <FAIcon ml={1} iconStyle="s" icon="cat" fontSize={"22px"} />
                ) : (
                    <></>
                )}
                <Text display="block" color={"gray.100"} noOfLines={1} width="100%">
                    {attendee?.displayName ?? "<Loading name>"}
                </Text>
                {microphoneEnabled !== undefined ? (
                    microphoneEnabled ? (
                        <FAIcon ml={1} iconStyle="s" icon="microphone" />
                    ) : (
                        <FAIcon ml={1} iconStyle="s" icon="microphone-slash" color="red.600" />
                    )
                ) : undefined}
            </HStack>
        </Button>
    );
}

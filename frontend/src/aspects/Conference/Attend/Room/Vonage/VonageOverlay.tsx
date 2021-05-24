import { Button, HStack, Image, Text, useToast } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useChatProfileModal } from "../../../../Chat/Frame/ChatProfileModalProvider";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useRegistrant } from "../../../RegistrantsContext";

export function VonageOverlay({
    connectionData,
    microphoneEnabled,
}: {
    connectionData: string;
    microphoneEnabled?: boolean;
}): JSX.Element {
    const registrantIdObj = useMemo(() => {
        try {
            const data = JSON.parse(connectionData);
            return data["registrantId"] ? { registrant: data["registrantId"] } : null;
        } catch (e) {
            console.warn("Couldn't parse registrant ID from Vonage subscriber data");
            return null;
        }
    }, [connectionData]);

    const registrant = useRegistrant(registrantIdObj);
    const profileModal = useChatProfileModal();
    const toast = useToast();

    return (
        <Button
            minW="unset"
            minH="unset"
            h="auto"
            p={0}
            m="3px"
            ml={2}
            size="xs"
            maxW="calc(100% - 6px - 0.8rem)"
            background="none"
            borderRadius={5}
            overflow="hidden"
            display="block"
            aria-label={`View ${registrant?.displayName ?? "<Loading name>"}'s profile`}
            onClick={() => {
                if (registrant && registrant.profile) {
                    profileModal.open({
                        ...registrant,
                        profile: registrant.profile,
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
                {registrant?.profile?.photoURL_50x50 ? (
                    <Image
                        borderRadius={5}
                        w="2rem"
                        h="auto"
                        objectFit="cover"
                        objectPosition="center"
                        src={registrant?.profile.photoURL_50x50}
                        alt={`Profile picture of ${registrant?.displayName}`}
                    />
                ) : registrant ? (
                    <FAIcon ml={1} iconStyle="s" icon="cat" fontSize={"22px"} />
                ) : (
                    <></>
                )}
                <Text display="block" color={"gray.100"} noOfLines={1} width="100%">
                    {registrant?.displayName ?? "<Loading name>"}
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

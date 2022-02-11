import { ViewOffIcon, WarningTwoIcon } from "@chakra-ui/icons";
import { Button, HStack, Image, Text, Tooltip, useToast, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import FAIcon from "../../../../../../Chakra/FAIcon";
import { useChatProfileModal } from "../../../../../../Chat/Frame/ChatProfileModalProvider";
import { useRegistrant } from "../../../../../RegistrantsContext";

export function VonageOverlay({
    connectionData,
    microphoneEnabled,
    cameraHidden,
    videoStatus,
    audioBlocked,
}: {
    connectionData: string;
    microphoneEnabled?: boolean;
    cameraHidden?: boolean;
    videoStatus?: {
        streamHasVideo: boolean;
        warning?: "quality";
        error?: "codec-not-supported" | "quality" | "exceeds-max-streams";
    };
    audioBlocked?: boolean;
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
        <VStack
            flexDir="column-reverse"
            alignItems="flex-start"
            height="100%"
            mx={1}
            mb={0.5}
            borderRadius={5}
            overflow="hidden"
        >
            <Button
                minW="0"
                maxW="100%"
                minH="unset"
                h="auto"
                p={0}
                my={1}
                size="xs"
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
                <HStack pr={2} bgColor="rgba(0,0,0,0.6)" maxWidth="100%">
                    {registrant?.profile?.photoURL_50x50 ? (
                        <Image
                            w="2rem"
                            h="auto"
                            objectFit="cover"
                            objectPosition="center"
                            src={registrant?.profile.photoURL_50x50}
                            overflow="hidden"
                            alt={`Profile picture of ${registrant?.displayName}`}
                        />
                    ) : (
                        <FAIcon
                            iconStyle="s"
                            icon="cat"
                            h="2rem"
                            w="2rem"
                            fontSize="24px"
                            color="white"
                            textAlign="center"
                        />
                    )}
                    <Text display="block" color={"gray.100"} noOfLines={1}>
                        {registrant?.displayName ?? "<Loading name>"}
                    </Text>
                    {microphoneEnabled !== undefined ? (
                        microphoneEnabled ? (
                            <FAIcon ml={1} iconStyle="s" icon="microphone" color="white" />
                        ) : (
                            <FAIcon ml={1} iconStyle="s" icon="microphone-slash" color="red.600" />
                        )
                    ) : undefined}
                </HStack>
            </Button>
            <HStack>
                {cameraHidden ? (
                    <Tooltip label="There are too many people here to show everyone's video at once. This person is hidden because they haven't spoken recently.">
                        <ViewOffIcon
                            w={6}
                            h={6}
                            bgColor="rgba(0,0,0,0.6)"
                            color="white"
                            p={1}
                            aria-label="Video hidden"
                            borderRadius={5}
                        />
                    </Tooltip>
                ) : undefined}
                {videoStatus?.error === "codec-not-supported" ? (
                    <Tooltip label="The video format is not supported in your browser.">
                        <WarningTwoIcon
                            w={6}
                            h={6}
                            bgColor="rgba(0,0,0,0.6)"
                            color="red.500"
                            p={1}
                            aria-label="Video format not supported"
                            borderRadius={5}
                        />
                    </Tooltip>
                ) : undefined}
                {videoStatus?.error === "quality" ? (
                    <Tooltip label="The video was hidden because the connection is not stable enough at the moment.">
                        <WarningTwoIcon
                            w={6}
                            h={6}
                            bgColor="rgba(0,0,0,0.6)"
                            color="red.500"
                            p={1}
                            aria-label="Connection too unstable to show video"
                            borderRadius={5}
                        />
                    </Tooltip>
                ) : undefined}
                {videoStatus?.warning === "quality" && videoStatus.error !== "quality" ? (
                    <Tooltip label="Video quality may be limited due to an unstable connection.">
                        <WarningTwoIcon
                            w={6}
                            h={6}
                            bgColor="rgba(0,0,0,0.6)"
                            color="orange.500"
                            p={1}
                            aria-label="Connection unstable"
                            borderRadius={5}
                        />
                    </Tooltip>
                ) : undefined}
                {audioBlocked ? (
                    <Tooltip label="Audio is currently blocked by your browser. Click to unblock.">
                        <WarningTwoIcon
                            w={6}
                            h={6}
                            bgColor="rgba(0,0,0,0.6)"
                            color="orange.500"
                            p={1}
                            aria-label="Audio blocked by browser"
                            onClick={() => {
                                OT.unblockAudio();
                            }}
                            borderRadius={5}
                        />
                    </Tooltip>
                ) : undefined}
            </HStack>
        </VStack>
    );
}

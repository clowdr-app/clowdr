import { ViewOffIcon, WarningTwoIcon } from "@chakra-ui/icons";
import { Button, HStack, Image, Text, Tooltip, useToast, VStack } from "@chakra-ui/react";
import React from "react";
import type { RegistrantDataFragment } from "../../../../../../../generated/graphql";
import FAIcon from "../../../../../../Chakra/FAIcon";
import { useChatProfileModal } from "../../../../../../Chat/Frame/ChatProfileModalProvider";

export default function CameraOverlay({
    registrant,
    microphoneEnabled,
    cameraHidden,
    videoStatus,
    audioBlocked,
    cameraType,
}: {
    registrant: RegistrantDataFragment | null;
    microphoneEnabled?: boolean;
    cameraHidden?: boolean;
    videoStatus?: {
        streamHasVideo: boolean;
        warning?: "quality";
        error?: "codec-not-supported" | "quality" | "exceeds-max-streams";
    };
    cameraType: "screen" | "camera";
    audioBlocked?: boolean;
}): JSX.Element {
    const profileModal = useChatProfileModal();
    const toast = useToast();

    return (
        <VStack
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%"
            overflow="hidden"
            zIndex={200}
            flexDir="column-reverse"
            alignItems="flex-start"
            mx={1}
            mb={0.5}
            borderRadius={5}
        >
            <Button
                minW="0"
                maxW="100%"
                minH="unset"
                h="auto"
                p={0}
                my={1}
                size="xs"
                fontSize="75%"
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
                            w="1.5rem"
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
                            h="1.5rem"
                            w="1.5rem"
                            fontSize="18px"
                            color="white"
                            textAlign="center"
                        />
                    )}
                    <Text display="block" color={"gray.100"} noOfLines={1}>
                        {registrant?.displayName ?? "<Loading name>"}
                    </Text>
                    {microphoneEnabled ? (
                        <FAIcon
                            ml={1}
                            iconStyle="s"
                            icon={cameraType === "screen" ? "volume-up" : "microphone"}
                            color="white"
                        />
                    ) : (
                        <FAIcon
                            ml={1}
                            iconStyle="s"
                            icon={cameraType === "screen" ? "volume-mute" : "microphone-slash"}
                            color="red.400"
                        />
                    )}
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

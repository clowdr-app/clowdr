import { ViewOffIcon, WarningTwoIcon } from "@chakra-ui/icons";
import { Button, HStack, Image, Text, Tooltip, useToast, VStack } from "@chakra-ui/react";
import React from "react";
import type { RegistrantDataFragment } from "../../../../../../../generated/graphql";
import { useChatProfileModal } from "../../../../../../Chat/Frame/ChatProfileModalProvider";
import { FAIcon } from "../../../../../../Icons/FAIcon";
import { FormattedMessage, useIntl } from "react-intl";

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
    const intl = useIntl();

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
                aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.ViewRegistrantsProfile', defaultMessage: "View {registrant}'s profile" }, { registrant: registrant?.displayName ?? "<Loading name>" })}
                onClick={() => {
                    if (registrant && registrant.profile) {
                        profileModal.open({
                            ...registrant,
                            profile: registrant.profile,
                        });
                    } else {
                        toast({
                            status: "warning",
                            title: intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.ProfileUnavaliable', defaultMessage: "Profile currently unavailable" }),
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
                            alt={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.ProfilePicture', defaultMessage: "Profile picture of {registrant}" }, { registrant: registrant?.displayName })}
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
                        {registrant?.displayName ?? intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.LoadingName', defaultMessage: "<Loading name>" })}
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
                    <Tooltip label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.TooManyPeopleTooltip', defaultMessage: "There are too many people here to show everyone's video at once. This person is hidden because they haven't spoken recently." })}>
                        <ViewOffIcon
                            w={6}
                            h={6}
                            bgColor="rgba(0,0,0,0.6)"
                            color="white"
                            p={1}
                            aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.VideoHidden', defaultMessage: "Video hidden" })}
                            borderRadius={5}
                        />
                    </Tooltip>
                ) : undefined}
                {videoStatus?.error === "codec-not-supported" ? (
                    <Tooltip label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.VideoFormatUnsupported', defaultMessage: "The video format is not supported in your browser." })}>
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
                    <Tooltip label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.ConnectionUnstableHidden', defaultMessage: "The video was hidden because the connection is not stable enough at the moment." })}>
                        <WarningTwoIcon
                            w={6}
                            h={6}
                            bgColor="rgba(0,0,0,0.6)"
                            color="red.500"
                            p={1}
                            aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.ConnectionTooUnstable', defaultMessage: "Connection too unstable to show video" })}
                            borderRadius={5}
                        />
                    </Tooltip>
                ) : undefined}
                {videoStatus?.warning === "quality" && videoStatus.error !== "quality" ? (
                    <Tooltip label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.VideoQualityLimited', defaultMessage: "Video quality may be limited due to an unstable connection." })}>
                        <WarningTwoIcon
                            w={6}
                            h={6}
                            bgColor="rgba(0,0,0,0.6)"
                            color="orange.500"
                            p={1}
                            aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.ConnectionUnstable', defaultMessage: "Connection unstable" })}
                            borderRadius={5}
                        />
                    </Tooltip>
                ) : undefined}
                {audioBlocked ? (
                    <Tooltip label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.AudioBlockedLabel', defaultMessage: "Audio is currently blocked by your browser. Click to unblock." })}>
                        <WarningTwoIcon
                            w={6}
                            h={6}
                            bgColor="rgba(0,0,0,0.6)"
                            color="orange.500"
                            p={1}
                            aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.Vonage.Components.Overlays.StatusOverlay.AudioBlockedAriaLabel', defaultMessage: "Audio blocked by browser" })}
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

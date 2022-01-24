import { gql } from "@apollo/client";
import { Box, Button, HStack, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useEnableBackstageStreamPreviewQuery } from "../../../../../../generated/graphql";
import { useConference } from "../../../../useConference";
import { HlsPlayer } from "../../Video/HlsPlayer";
import { VideoAspectWrapper } from "../../Video/VideoAspectWrapper";
import { FormattedMessage, useIntl } from "react-intl";

gql`
    query EnableBackstageStreamPreview($conferenceId: uuid!) {
        conference_Configuration_by_pk(key: ENABLE_BACKSTAGE_STREAM_PREVIEW, conferenceId: $conferenceId) {
            key
            conferenceId
            value
        }
    }
`;

export default function StreamPreview({
    hlsUri,
    isLive,
    isLiveOnAir,
}: {
    hlsUri: string | undefined;
    isLive: boolean;
    isLiveOnAir: boolean;
}): JSX.Element {
    const bgColor = useColorModeValue("gray.100", "gray.800");
    const [enabled, setEnabled] = useState<boolean>(true);
    const conference = useConference();
    const configResponse = useEnableBackstageStreamPreviewQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const [delayCompleted, setDelayCompleted] = useState<boolean>(false);
    useEffect(() => {
        if (hlsUri) {
            setTimeout(() => {
                setDelayCompleted(true);
            }, 5000);
        }
    }, [hlsUri]);

    if (configResponse.data?.conference_Configuration_by_pk?.value !== true) {
        return <></>;
    }

    return hlsUri && (isLive || delayCompleted) && enabled ? (
        <Box
            pos="relative"
            spacing={1}
            minW="300px"
            maxW="calc(9vh / 16vh)"
            w="20vw"
            border="1px solid #999"
            bgColor={bgColor}
        >
            <Box pos="relative" w="100%" maxH="240px" overflow="hidden" zIndex={1}>
                <VideoAspectWrapper>
                    {(onAspectRatioChange) => (
                        <HlsPlayer
                            canPlay={isLive}
                            hlsUri={hlsUri}
                            onAspectRatioChange={onAspectRatioChange}
                            expectLivestream={isLive}
                            forceMute={isLiveOnAir}
                            initialMute={true}
                        />
                    )}
                </VideoAspectWrapper>
            </Box>
            <VStack
                pos="absolute"
                whiteSpace="normal"
                flex="0 1 100%"
                zIndex={2}
                bgColor="rgba(255, 255, 255, 0.8)"
                color="black"
                fontWeight="bold"
                top={0}
                left={0}
                w="100%"
                justifyContent="flex-start"
                alignItems="flex-start"
                px={1}
                spacing={0}
            >
                <Text whiteSpace="normal" alignSelf="center">
                    <FormattedMessage
                        id="Conference.Attend.Room.Stream.Controls.StreamPreview.StreamPreview"
                        defaultMessage="Stream preview"
                    />
                </Text>
                <Text whiteSpace="normal" fontSize="xs">
                    <FormattedMessage
                        id="Conference.Attend.Room.Stream.Controls.StreamPreview.LagNotice"
                        defaultMessage="Please note: the preview plays with a lag."
                    />
                    
                </Text>
                <Text whiteSpace="normal" fontSize="xs">
                    <FormattedMessage
                        id="Conference.Attend.Room.Stream.Controls.StreamPreview.AvoidEchoes"
                        defaultMessage="To avoid echoes, mute the preview while you are live on air."
                    />
                    
                </Text>
            </VStack>
            <HStack spacing={1} justifyContent="center" p={1}>
                <Text fontSize="sm" fontWeight="bold">
                    <FormattedMessage
                        id="Conference.Attend.Room.Stream.Controls.StreamPreview.ConnectionTrouble"
                        defaultMessage="Connection trouble?"
                    />
                </Text>
                <Button colorScheme="PrimaryActionButton" size="xs" onClick={() => setEnabled(false)}>
                    <FormattedMessage
                        id="Conference.Attend.Room.Stream.Controls.StreamPreview.TryDisablingPreview"
                        defaultMessage="Try disabling preview"
                    />
                    
                </Button>
            </HStack>
        </Box>
    ) : hlsUri && (!enabled || !delayCompleted) ? (
        <Button
            colorScheme="PrimaryActionButton"
            size="md"
            onClick={() => {
                setEnabled(true);
                setDelayCompleted(true);
            }}
        >
            <FormattedMessage
                id="Conference.Attend.Room.Stream.Controls.StreamPreview.EnablePreview"
                defaultMessage="Enable stream preview"
            />
        </Button>
    ) : (
        <Text
            textAlign="center"
            pos="relative"
            minW="240px"
            maxW="400px"
            maxH="240px"
            w="10vw"
            whiteSpace="normal"
            border="1px solid #999"
            bgColor={bgColor}
        >
            <FormattedMessage
                id="Conference.Attend.Room.Stream.Controls.StreamPreview.StreamPreviewAvaliablity"
                defaultMessage="Stream preview will be available when the stream starts."
            />
        </Text>
    );
}

import { Box, Button, HStack, Spinner, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import React, { Suspense, useEffect, useState } from "react";
import { gql } from "urql";
import { useContextSelector } from "use-context-selector";
import { useEnableBackstageStreamPreviewQuery } from "../../../../../../generated/graphql";
import { useConference } from "../../../../useConference";
import { VideoAspectWrapper } from "../../Video/VideoAspectWrapper";
import { BackstageContext } from "../BackstageContext";

const HlsPlayer = React.lazy(() => import("../../Video/HlsPlayer"));

gql`
    query EnableBackstageStreamPreview($conferenceId: uuid!) @cached {
        conference_Configuration_by_pk(key: ENABLE_BACKSTAGE_STREAM_PREVIEW, conferenceId: $conferenceId) {
            key
            conferenceId
            value
        }
    }
`;

export default function StreamPreview(): JSX.Element {
    const hlsUri = useContextSelector(BackstageContext, (state) => state.hlsUri);
    const isLive = useContextSelector(BackstageContext, (state) => state.live);
    const isLiveOnAir = useContextSelector(BackstageContext, (state) => state.liveOnAir);

    const bgColor = useColorModeValue("gray.100", "gray.800");
    const [enabled, setEnabled] = useState<boolean>(false);
    const conference = useConference();
    const [configResponse] = useEnableBackstageStreamPreviewQuery({
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
        <Box pos="relative" minW="300px" maxW="calc(9vh / 16vh)" w="20vw" border="1px solid #999" bgColor={bgColor}>
            <Box pos="relative" w="100%" maxH="240px" overflow="hidden" zIndex={1}>
                <Suspense fallback={<Spinner />}>
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
                </Suspense>
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
                    Stream preview
                </Text>
                <Text whiteSpace="normal" fontSize="xs">
                    Please note: the preview plays with a lag.
                </Text>
                <Text whiteSpace="normal" fontSize="xs">
                    To avoid echoes, mute the preview while you are live on air.
                </Text>
            </VStack>
            <HStack spacing={1} justifyContent="center" p={1}>
                <Text fontSize="sm" fontWeight="bold">
                    Connection trouble?
                </Text>
                <Button colorScheme="PrimaryActionButton" size="xs" onClick={() => setEnabled(false)}>
                    Try disabling preview
                </Button>
            </HStack>
        </Box>
    ) : hlsUri && (!enabled || !delayCompleted) ? (
        <Button
            colorScheme="PrimaryActionButton"
            size="sm"
            h="auto"
            maxH="auto"
            whiteSpace="normal"
            flexShrink={1}
            p={3}
            w="min-content"
            onClick={() => {
                setEnabled(true);
                setDelayCompleted(true);
            }}
        >
            Enable stream preview
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
            Stream preview will be available when the stream starts.
        </Text>
    );
}

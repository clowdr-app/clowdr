import { Box, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { HlsPlayer } from "../../Video/HlsPlayer";
import { VideoAspectWrapper } from "../../Video/VideoAspectWrapper";

export default function StreamPreview({
    hlsUri,
    isLive,
    isLiveOnAir,
}: {
    hlsUri: string | undefined;
    isLive: boolean;
    isLiveOnAir: boolean;
}): JSX.Element {
    return hlsUri ? (
        <VStack spacing={1} maxW="400px" maxH="240px" w="10vw" border="1px solid black">
            <Text pos="relative" whiteSpace="normal" flex="0 1 100%">
                Stream preview
            </Text>
            <Text pos="relative" whiteSpace="normal" fontSize="xs" flex="0 1 100%">
                Please remember the preview plays with a lag.
            </Text>
            <Box pos="relative" flex="0 1 100%">
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
            <Text pos="relative" whiteSpace="normal" fontSize="xs" flex="0 1 100%">
                To avoid echoes, mute the preview while you are live on air.
            </Text>
        </VStack>
    ) : (
        <Text pos="relative" maxW="400px" maxH="240px" w="10vw" whiteSpace="normal">
            Stream preview not currently available
        </Text>
    );
}

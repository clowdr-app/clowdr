import { Box, useToast } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { VideoPlayer } from "../../Video/VideoPlayer";

export default function VideoChatVideoPlayer({ elementId }: { elementId: string }): JSX.Element {
    const toast = useToast();

    useEffect(() => {
        toast({
            title: "Please click play",
            status: "success",
            position: "top",
            description:
                "The presenter would like to play a video. Please click play on the video player to join in. (Midspace cannot auto-play due to browser restrictions).",
            isClosable: true,
            duration: 15000,
            variant: "subtle",
        });
    }, [toast]);

    return (
        <Box>
            <VideoPlayer elementId={elementId} mode="CONTROLLED" />
        </Box>
    );
}

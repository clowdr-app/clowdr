import { Box, Flex, Heading, Skeleton, SkeletonCircle, SkeletonText } from "@chakra-ui/react";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import type { RoomDetailsFragment } from "../../../../generated/graphql";

export function EventRoom({ roomDetails }: { roomDetails: RoomDetailsFragment }): JSX.Element {
    const hlsUri = useMemo(() => {
        if (!roomDetails.mediaLiveChannel) {
            return null;
        }
        const finalUri = new URL(roomDetails.mediaLiveChannel.endpointUri);
        finalUri.hostname = roomDetails.mediaLiveChannel.cloudFrontDomain;
        return finalUri.toString();
    }, [roomDetails.mediaLiveChannel]);
    return (
        <Flex width="100%" height="100%" gridColumnGap={5}>
            <Box textAlign="left" flexGrow={1} overflowY="auto" p={2}>
                {hlsUri ? (
                    <ReactPlayer
                        url={hlsUri}
                        height="80vh"
                        width="100%"
                        config={{
                            file: {
                                hlsOptions: {},
                            },
                        }}
                        playing={true}
                        controls={true}
                    />
                ) : (
                    <Skeleton height="80vh" width="100%"></Skeleton>
                )}
                <Heading as="h2" textAlign="left" mt={5}>
                    {roomDetails.name}
                </Heading>
            </Box>
            <Box width="30%" border="1px solid white" height="100%">
                <SkeletonCircle size="20" />
                <SkeletonText mt={8} noOfLines={5} spacing={5} />
            </Box>
        </Flex>
    );
}

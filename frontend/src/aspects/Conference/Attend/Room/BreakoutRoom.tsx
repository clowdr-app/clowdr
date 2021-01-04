import {
    Box,
    Flex,
    Heading,
    SkeletonCircle,
    SkeletonText,
    useBreakpointValue,
    useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import type { RoomDetailsFragment } from "../../../../generated/graphql";
import { VonageRoomStateProvider } from "../../../Vonage/useVonageRoom";
import VonageRoom from "./VonageRoom";

export function BreakoutRoom({ roomDetails }: { roomDetails: RoomDetailsFragment }): JSX.Element {
    const backgroundColor = useColorModeValue("gray.50", "gray.900");
    const stackColumns = useBreakpointValue({ base: true, lg: false });
    return (
        <Flex width="100%" height="100%" gridColumnGap={5} flexWrap={stackColumns ? "wrap" : "nowrap"}>
            <Box textAlign="left" flexGrow={1} overflowY="auto" p={2}>
                <Box height="80vh" width="100%" background={backgroundColor}>
                    <VonageRoomStateProvider>
                        <VonageRoom roomId={roomDetails.id} />
                    </VonageRoomStateProvider>
                </Box>
                <Heading as="h2" textAlign="left" mt={5}>
                    {roomDetails.name}
                </Heading>
            </Box>
            <Box width={stackColumns ? "100%" : "30%"} border="1px solid white" height="100%">
                <SkeletonCircle size="20" />
                <SkeletonText mt={8} noOfLines={5} spacing={5} />
            </Box>
        </Flex>
    );
}

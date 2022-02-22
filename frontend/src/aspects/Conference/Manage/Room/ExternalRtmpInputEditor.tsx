import { Code, Text, VStack } from "@chakra-ui/react";
import React from "react";

export default function ExternalRtmpInputEditor({ roomId }: { roomId: string }): JSX.Element {
    // TODO: Follow the same model as ExternalRTMPBroadcastEditor to insert an RoomRtmpInput record for the room
    return (
        <VStack alignItems="flex-start" spacing={4}>
            <Text>
                Please contact support to request configuration of a hybrid room (external RTMP input) quoting your
                conference name and the following room identifer.
            </Text>
            <Code>{roomId}</Code>
            <Text>
                Please submit your request at least 48 hours prior to the start of your first hybrid session (though we
                recommend allowing additional time to organize a test stream).
            </Text>
        </VStack>
    );
}

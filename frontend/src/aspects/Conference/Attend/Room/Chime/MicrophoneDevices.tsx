import { Box, chakra, Progress, Text } from "@chakra-ui/react";
import { MicSelection, useLocalAudioInputActivity } from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React, { useState } from "react";

export const MicrophoneDevices = chakra(MicrophoneDevicesInner);

function MicrophoneDevicesInner({ className }: { className?: string }): JSX.Element {
    return (
        <Box className={className}>
            <MicSelection />
            <MicrophoneActivityPreview />
        </Box>
    );
}

export function MicrophoneActivityPreview(): JSX.Element {
    const [value, setValue] = useState(0);
    useLocalAudioInputActivity((d) => setValue(d));

    return (
        <>
            <Text>Microphone activity</Text>
            <Progress sx={{ div: { transition: "all 0.01s" } }} value={value} min={0} max={1} />
        </>
    );
}

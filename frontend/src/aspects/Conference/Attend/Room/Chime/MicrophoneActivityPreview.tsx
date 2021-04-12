import { chakra, FormControl, FormLabel, Progress, useId } from "@chakra-ui/react";
import { useLocalAudioInputActivity } from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React, { useState } from "react";

export function MicrophoneActivityPreviewInner({ className }: { className?: string }): JSX.Element {
    const [value, setValue] = useState(0);
    useLocalAudioInputActivity((d) => setValue(d));
    const id = useId();

    return (
        <FormControl className={className}>
            <FormLabel htmlFor={id}>Microphone activity</FormLabel>
            <Progress id={id} sx={{ div: { transition: "all 0.01s" } }} value={value} min={0} max={1} />
        </FormControl>
    );
}

export const MicrophoneActivityPreview = chakra(MicrophoneActivityPreviewInner);

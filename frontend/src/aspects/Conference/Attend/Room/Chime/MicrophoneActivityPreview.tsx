import { chakra, FormControl, FormLabel, Progress, useId } from "@chakra-ui/react";
import { useLocalAudioInputActivity } from "amazon-chime-sdk-component-library-react";
import React, { useState } from "react";

export function MicrophoneActivityPreviewInner({ className }: { className?: string }): JSX.Element {
    const [value, setValue] = useState<number>(0);
    useLocalAudioInputActivity((d) =>
        setValue((oldValue) => {
            oldValue -= oldValue / 5;
            oldValue += d / 5;

            return oldValue;
        })
    );
    const id = useId();

    return (
        <FormControl className={className}>
            <FormLabel htmlFor={id}>Microphone activity</FormLabel>
            <Progress id={id} sx={{ div: { transition: "all 0s" } }} value={value} min={0} max={1} />
        </FormControl>
    );
}

export const MicrophoneActivityPreview = chakra(MicrophoneActivityPreviewInner);

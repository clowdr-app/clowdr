import React from "react";
import { MicrophoneActivityPreview } from "../MicrophoneActivityPreview";
import { MicrophoneSelection } from "./MicrophoneSelection";

export function MicrophoneDevices(): JSX.Element {
    return (
        <>
            <MicrophoneSelection mb={4} />
            <MicrophoneActivityPreview />
        </>
    );
}

import { Heading, Input, Select, Text } from "@chakra-ui/react";
import React, { ChangeEvent, FocusEvent, useCallback, useState } from "react";
import { HlsPlayer } from "./HlsPlayer";
import { HlsPlayerV1 } from "./HlsPlayerV1";
import { VideoAspectWrapper } from "./VideoAspectWrapper";

const defaultUri = "https://playertest.longtailvideo.com/streams/live-vtt-countdown/live.m3u8";

export function VideoTestPage(): JSX.Element {
    const [choice, setChoice] = useState<"v1" | "v2">("v2");
    const [uri, setUri] = useState<string>(defaultUri);

    const handlePlayerChange = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            setChoice(event.target.value as "v1" | "v2");
        },
        [setChoice]
    );

    const handleUriChange = useCallback(
        (event: FocusEvent<HTMLInputElement>) => {
            setUri(event.target.value ? event.target.value : defaultUri);
        },
        [setUri]
    );

    return (
        <>
            <Heading as="h1">Video player test</Heading>

            <Select placeholder="Select video player" onChange={handlePlayerChange} value={choice}>
                <option value="v1">V1: React-Player + HLS.js (native player)</option>
                <option value="v2">V2: video.js</option>
            </Select>

            <Input placeholder={defaultUri} onBlur={handleUriChange} />

            <VideoAspectWrapper>
                {(onAspectRatioChange) =>
                    choice === "v1" ? (
                        <HlsPlayerV1 canPlay={true} hlsUri={uri} />
                    ) : (
                        <HlsPlayer canPlay={true} hlsUri={uri} onAspectRatioChange={onAspectRatioChange} />
                    )
                }
            </VideoAspectWrapper>

            <Text>This is a test of the HLS stream component.</Text>
        </>
    );
}

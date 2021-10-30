import {
    chakra,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Input,
    Select,
    Spinner,
    Switch,
    Text,
} from "@chakra-ui/react";
import type { ChangeEvent, FocusEvent } from "react";
import React, { Suspense, useCallback, useState } from "react";
import { VideoAspectWrapper } from "./VideoAspectWrapper";

const HlsPlayer = React.lazy(() => import("./HlsPlayer"));
const HlsPlayerV1 = React.lazy(() => import("./HlsPlayerV1"));

const defaultUri = "https://playertest.longtailvideo.com/streams/live-vtt-countdown/live.m3u8";

export function VideoTestPage(): JSX.Element {
    const [choice, setChoice] = useState<"v1" | "v2">("v2");
    const [uri, setUri] = useState<string>(defaultUri);
    const [expectLivestream, setExpectLivestream] = useState<boolean>(false);

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

    const [mountPlayer, setMountPlayer] = useState<boolean>(true);

    return (
        <>
            <Heading as="h1">Video player test</Heading>

            <chakra.form>
                <FormControl>
                    <FormLabel htmlFor="video-player" mt={2}>
                        Player
                    </FormLabel>
                    <Select
                        placeholder="Select video player"
                        onChange={handlePlayerChange}
                        value={choice}
                        id="video-player"
                    >
                        <option value="v1">V1: React-Player + HLS.js (native player)</option>
                        <option value="v2">V2: video.js</option>
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel htmlFor="manifest-url" mt={2}>
                        Manifest URL
                    </FormLabel>
                    <Input placeholder={defaultUri} onBlur={handleUriChange} id="manifest-url" />
                </FormControl>
                <HStack>
                    <FormControl>
                        <FormLabel htmlFor="expect-livestream" mt={2}>
                            Expect a livestream
                        </FormLabel>
                        <Switch
                            id="expect-livestream"
                            isChecked={expectLivestream}
                            onChange={() => setExpectLivestream((v) => !v)}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel htmlFor="mount-player" mt={2}>
                            Mount player
                        </FormLabel>
                        <Switch id="mount-player" isChecked={mountPlayer} onChange={() => setMountPlayer((v) => !v)} />
                    </FormControl>
                </HStack>
            </chakra.form>

            {mountPlayer ? (
                <Suspense fallback={<Spinner />}>
                    <VideoAspectWrapper>
                        {(onAspectRatioChange) =>
                            choice === "v1" ? (
                                <HlsPlayerV1 canPlay={true} hlsUri={uri} />
                            ) : (
                                <HlsPlayer
                                    canPlay={true}
                                    hlsUri={uri}
                                    onAspectRatioChange={onAspectRatioChange}
                                    expectLivestream={expectLivestream ?? undefined}
                                />
                            )
                        }
                    </VideoAspectWrapper>
                </Suspense>
            ) : undefined}

            <Text>This is a test of the HLS stream component.</Text>
        </>
    );
}

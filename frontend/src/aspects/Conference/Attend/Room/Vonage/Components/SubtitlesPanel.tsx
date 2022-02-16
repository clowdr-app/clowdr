import { Grid, GridItem } from "@chakra-ui/react";
import type { MutableRefObject } from "react";
import React, { useEffect, useRef, useState } from "react";
import type { TranscriptData } from "../VonageGlobalState";

export default function SubtitlesPanel({
    onTranscriptRef,
}: {
    onTranscriptRef?: MutableRefObject<((data: TranscriptData) => void) | undefined>;
}): JSX.Element {
    const transcripts = useRef<{ name: string; transcript: string; createdAt: number }[]>([]);

    useEffect(() => {
        if (onTranscriptRef) {
            onTranscriptRef.current = (data) => {
                transcripts.current.push({
                    createdAt: Date.now(),
                    name: data.registrant.name,
                    transcript: data.transcript,
                });
            };
        }
    }, [onTranscriptRef]);

    const [renderedTranscripts, setRenderedTranscripts] = useState<JSX.Element[]>([]);
    useEffect(() => {
        const tId = setInterval(() => {
            const now = Date.now();
            transcripts.current = transcripts.current.filter((transcript) => now - transcript.createdAt < 15000);

            const result = transcripts.current.flatMap((transcript, idx) => {
                const key = `t${idx}`;
                return [
                    <GridItem color="gray.200" key={key + "-name"}>
                        {transcript.name}
                    </GridItem>,
                    <GridItem color="white" key={key + "-transcript"}>
                        {transcript.transcript}
                    </GridItem>,
                ];
            });
            setRenderedTranscripts(result);
        }, 500);
        return () => {
            clearInterval(tId);
        };
    }, []);

    return (
        <Grid
            p={2}
            bgColor="purple.600"
            borderTopColor="purple.400"
            borderTopStyle="solid"
            borderTopWidth={1}
            templateColumns="fit-content(20%) auto"
            columnGap={4}
            rowGap={2}
            w="100%"
        >
            {renderedTranscripts}
        </Grid>
    );
}

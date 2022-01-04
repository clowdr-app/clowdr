import { Grid, GridItem } from "@chakra-ui/react";
import type { MutableRefObject } from "react";
import React, { useEffect, useRef, useState } from "react";
import type { TranscriptData } from "../VonageGlobalState";

export default function SubtitlesPanel({
    onTranscriptRef,
}: {
    onTranscriptRef?: MutableRefObject<((data: TranscriptData) => void) | undefined>;
}): JSX.Element {
    const transcripts = useRef(
        new Map<string, { name: string; transcript: string; createdAt: number; updatedAt: number }>()
    );

    useEffect(() => {
        if (onTranscriptRef) {
            onTranscriptRef.current = (data) => {
                const existing = transcripts.current.get(data.registrant.id);
                if (existing) {
                    existing.updatedAt = Date.now();
                    existing.transcript = data.transcript;
                    existing.name = data.registrant.name;
                } else {
                    transcripts.current.set(data.registrant.id, {
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        name: data.registrant.name,
                        transcript: data.transcript,
                    });
                }
            };
        }
    }, [onTranscriptRef]);

    const [renderedTranscripts, setRenderedTranscripts] = useState<JSX.Element[]>([]);
    useEffect(() => {
        const tId = setInterval(() => {
            const now = Date.now();
            for (const [id, transcript] of transcripts.current) {
                if (now - transcript.updatedAt > 15000) {
                    transcripts.current.delete(id);
                }
            }

            const transcriptsArr = [...transcripts.current.entries()];
            transcriptsArr.sort(([_x, x], [_y, y]) => x.createdAt - y.createdAt);
            const result = transcriptsArr.flatMap(([key, transcript]) => [
                <GridItem color="gray.200" key={key + "-name"}>
                    {transcript.name}
                </GridItem>,
                <GridItem color="white" key={key + "-transcript"}>
                    {transcript.transcript}
                </GridItem>,
            ]);
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

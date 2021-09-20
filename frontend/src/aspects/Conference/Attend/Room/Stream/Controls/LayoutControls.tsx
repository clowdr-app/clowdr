import { gql } from "@apollo/client";
import { Accordion, AccordionButton, AccordionItem, AccordionPanel, Button, useToast } from "@chakra-ui/react";
import { VonageSessionLayoutData, VonageSessionLayoutType } from "@clowdr-app/shared-types/build/vonage";
import React, { useCallback } from "react";
import {
    useInsertVonageSessionLayoutMutation,
    VonageParticipantStreamDetailsFragment,
} from "../../../../../../generated/graphql";
import { useConference } from "../../../../useConference";
import { PairLayoutForm } from "./Layouts/PairLayoutForm";
import { PictureInPictureLayoutForm } from "./Layouts/PictureInPictureLayoutForm";
import { SingleLayoutForm } from "./Layouts/SingleLayoutForm";

gql`
    mutation InsertVonageSessionLayout($vonageSessionId: String!, $conferenceId: uuid!, $layoutData: jsonb!) {
        insert_video_VonageSessionLayout_one(
            object: { vonageSessionId: $vonageSessionId, conferenceId: $conferenceId, layoutData: $layoutData }
        ) {
            id
        }
    }
`;

export function LayoutControls({
    live,
    streams,
    vonageSessionId,
}: {
    live: boolean;
    streams: readonly VonageParticipantStreamDetailsFragment[] | null;
    vonageSessionId: string | null;
}): JSX.Element {
    const [insertLayout] = useInsertVonageSessionLayoutMutation();
    const toast = useToast();

    const conference = useConference();

    const setLayout = useCallback(
        async (layoutData: VonageSessionLayoutData) => {
            if (!vonageSessionId) {
                console.error("No Vonage session available for layout insert");
                throw new Error("No Vonage session available for layout insert");
            }

            try {
                await insertLayout({
                    variables: {
                        conferenceId: conference.id,
                        vonageSessionId,
                        layoutData,
                    },
                });
            } catch (e) {
                console.error("Failed to insert layout of Vonage broadcast", e);
                toast({
                    status: "error",
                    title: "Could not set the broadcast layout",
                    description: "If this error persists, you may need to leave and re-enter the room.",
                });
            }
        },
        [conference.id, vonageSessionId, toast, insertLayout]
    );
    return (
        <>
            {!live ? (
                <>Broadcast controls not available while event is off air.</>
            ) : !streams ? undefined : streams.length === 0 ? (
                <>No streams that can be broadcast.</>
            ) : (
                <>
                    <Accordion>
                        <AccordionItem>
                            <AccordionButton>Auto layout</AccordionButton>
                            <AccordionPanel>
                                <Button
                                    colorScheme="purple"
                                    aria-label="Set stream layout to automatic mode"
                                    onClick={() => setLayout({ type: VonageSessionLayoutType.BestFit })}
                                >
                                    Auto layout
                                </Button>
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>Side-by-side layout</AccordionButton>
                            <AccordionPanel>
                                <PairLayoutForm streams={streams} setLayout={setLayout} />
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>Fullscreen layout</AccordionButton>
                            <AccordionPanel>
                                <SingleLayoutForm streams={streams} setLayout={setLayout} />
                            </AccordionPanel>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionButton>Picture-in-picture layout</AccordionButton>
                            <AccordionPanel>
                                <PictureInPictureLayoutForm streams={streams} setLayout={setLayout} />
                            </AccordionPanel>
                        </AccordionItem>
                    </Accordion>
                </>
            )}
        </>
    );
}

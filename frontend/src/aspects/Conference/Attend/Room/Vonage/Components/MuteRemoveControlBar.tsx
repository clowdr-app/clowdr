import { Button, ButtonGroup } from "@chakra-ui/react";
import React from "react";
import { useVonageGlobalState } from "../VonageGlobalStateProvider";

export default function MuteRemoveControlBar({
    streamId,
    connectionId,
}: {
    streamId?: string;
    connectionId: string;
}): JSX.Element {
    const vonage = useVonageGlobalState();

    // const canForceMute = vonage.canForceMute;
    const canForceUnpublish = vonage.canForceUnpublish;
    const canForceDisconnect = vonage.canForceDisconnect;

    if (/* canForceMute || */ canForceUnpublish || canForceDisconnect) {
        return (
            <ButtonGroup
                zIndex={400}
                position="absolute"
                top={1}
                left={1}
                w="calc(100% - 20px)"
                h="calc(100% - 8.5ex)"
                overflow="hidden"
                colorScheme="DestructiveActionButton"
                flexWrap="wrap"
                gridRowGap={1}
                spacing={1}
                justifyContent="flex-start"
                alignItems="flex-start"
                opacity={0}
                _hover={{
                    opacity: 1,
                }}
                _focus={{
                    opacity: 1,
                }}
                _active={{
                    opacity: 1,
                }}
                transition="opacity 0.2s ease-in-out"
            >
                {/* TODO: If we ever decide to use mute/unmute properly rather than
                              using publish/unpublish of audio.
                        {streamHasAudio && canForceMute ? (
                        <Button
                            onClick={() => {
                                vonage.forceMute(stream.streamId);
                            }}
                        >
                            Mute
                        </Button>
                    ) : undefined} */}
                {streamId && canForceUnpublish ? (
                    <Button
                        onClick={() => {
                            vonage.forceUnpublish(streamId);
                        }}
                        size="xs"
                    >
                        Mute / Hide
                    </Button>
                ) : undefined}
                {canForceDisconnect ? (
                    <Button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to remove this person from the room?")) {
                                vonage.forceDisconnect(connectionId);
                            }
                        }}
                        size="xs"
                    >
                        Remove
                    </Button>
                ) : undefined}
            </ButtonGroup>
        );
    }

    return <></>;
}

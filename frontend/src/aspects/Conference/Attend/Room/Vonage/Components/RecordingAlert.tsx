import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    ButtonGroup,
    Text,
    VStack,
} from "@chakra-ui/react";
import React, { useRef } from "react";

export function RecordingAlert({
    isOpen,
    eventIsFuture,
    onReject,
    onAccept,
}: {
    isOpen: boolean;
    eventIsFuture: boolean;
    onReject?: (message: string) => void;
    onAccept?: () => void;
}): JSX.Element {
    const leastDestructiveRef = useRef<HTMLButtonElement | null>(null);

    return (
        <AlertDialog
            isOpen={isOpen}
            onClose={() => {
                // Empty
            }}
            leastDestructiveRef={leastDestructiveRef}
        >
            <AlertDialogOverlay />
            <AlertDialogContent>
                <AlertDialogHeader>Video is being recorded</AlertDialogHeader>
                <AlertDialogBody>
                    <VStack spacing={4} alignItems="flex-start">
                        <Text>
                            The video-chat you are about to join{" "}
                            {eventIsFuture ? "will be recorded when the event starts" : "is being recorded"}.
                        </Text>
                        <Text>
                            By clicking Join below you consent to being recorded and for the recording to be owned and
                            managed by the organizers of this conference.
                        </Text>
                        <Text>For further information, please speak to your conference organizers.</Text>
                    </VStack>
                </AlertDialogBody>
                <AlertDialogFooter>
                    <ButtonGroup spacing={2}>
                        <Button
                            ref={leastDestructiveRef}
                            onClick={() => {
                                onReject?.("Declined to be recorded");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                onAccept?.();
                            }}
                            colorScheme="PrimaryActionButton"
                        >
                            Join
                        </Button>
                    </ButtonGroup>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

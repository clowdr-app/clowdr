import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import React, { useCallback, useContext, useEffect, useRef } from "react";
import { AutoplayContext } from "../Vonage/VideoPlayback/AutoplayContext";

export function AutoplayAlert({ connected }: { connected: boolean }): JSX.Element {
    const autoplay = useContext(AutoplayContext);
    const autoplayAlert = useDisclosure();
    const autoplayCancelRef = useRef<HTMLButtonElement | null>(null);
    const toast = useToast();

    useEffect(() => {
        async function fn() {
            await autoplay.unblockAutoplay();
        }

        fn().catch((err) => console.error(err));
    }, [autoplay]);

    const unblockAutoplay = useCallback(() => {
        autoplay
            .unblockAutoplay()
            .then((result) => {
                if (!result) {
                    toast({
                        status: "error",
                        title: "Could not enable video playback.",
                    });
                } else {
                    autoplayAlert.onClose();
                }
            })
            .catch((err) => console.error(err));
    }, [autoplay, autoplayAlert, toast]);

    const dismissUnblockAutoplay = useCallback(() => {
        autoplay.setAutoplayAlertDismissed(true);
        autoplayAlert.onClose();
    }, [autoplay, autoplayAlert]);

    useEffect(() => {
        if (connected && autoplay.autoplayBlocked && !autoplay.autoplayAlertDismissed) {
            autoplayAlert.onOpen();
        } else if (!autoplay.autoplayBlocked) {
            autoplayAlert.onClose();
        }
    }, [autoplay.autoplayBlocked, autoplayAlert, autoplay.autoplayAlertDismissed, connected]);

    return (
        <AlertDialog
            isOpen={autoplayAlert.isOpen}
            leastDestructiveRef={autoplayCancelRef}
            onClose={autoplayAlert.onClose}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        You must enable video playback
                    </AlertDialogHeader>

                    <AlertDialogBody>Midspace cannot automatically play videos in your browser.</AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={autoplayCancelRef} onClick={dismissUnblockAutoplay} ml={3}>
                            Dismiss
                        </Button>
                        <Button colorScheme="ConfirmButton" onClick={unblockAutoplay} ml={3}>
                            Enable video playback
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
}

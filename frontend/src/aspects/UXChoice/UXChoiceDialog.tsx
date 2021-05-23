import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    HStack,
    Text,
    VStack,
} from "@chakra-ui/react";
import React, { useRef } from "react";
import { FAIcon } from "../Icons/FAIcon";
import { useUXChoice, UXChoice } from "./UXChoice";

export default function UXChoiceDialog(): JSX.Element {
    const { rawChoice, setChoice, isOpen, onClose } = useUXChoice();
    const leastDestructiveRef = useRef<HTMLButtonElement | null>(null);

    return (
        <AlertDialog
            isOpen={isOpen}
            onClose={onClose}
            leastDestructiveRef={leastDestructiveRef}
            isCentered
            closeOnEsc={false}
            closeOnOverlayClick={false}
            size="xl"
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        {rawChoice !== null
                            ? "Changed your mind? No problem!"
                            : "Hi, we've got a quick choice for you…"}
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <VStack alignItems="flex-start">
                            {rawChoice === null ? (
                                <>
                                    <Text fontSize="lg">New to Clowdr? We recommend our new, simpler experience</Text>
                                    <Text fontSize="sm">All the same features, just easier to navigate.</Text>
                                    <Text fontSize="lg" pt={2}>
                                        Used Clowdr recently and would rather stick with the old version?
                                    </Text>
                                </>
                            ) : undefined}
                            <Text fontSize="sm">
                                You can change your mind any time using the &ldquo;Switch UI&rdquo; button in the
                                Profile menu.
                            </Text>
                        </VStack>
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <HStack pt={2}>
                            <Button
                                colorScheme="blue"
                                onClick={() => {
                                    setChoice(UXChoice.V1);
                                    onClose();
                                }}
                                ml={3}
                            >
                                <FAIcon iconStyle="s" icon="arrow-down" mr={2} />
                                Stick with the old
                            </Button>
                            <Button
                                colorScheme="purple"
                                ref={leastDestructiveRef}
                                onClick={() => {
                                    setChoice(UXChoice.V2);
                                    onClose();
                                }}
                            >
                                <FAIcon iconStyle="s" icon="arrow-up" mr={2} />
                                Use the new experience
                            </Button>
                        </HStack>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
}

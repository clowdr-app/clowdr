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
import { FormattedMessage, useIntl } from "react-intl";

export default function UXChoiceDialog(): JSX.Element {
    const intl = useIntl();
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
                            ? intl.formatMessage({ id: 'uxchoice.uxchoicedialog.changedyourmind', defaultMessage: "Changed your mind? No problem!" })
                            : intl.formatMessage({ id: 'uxchoice.uxchoicedialog.quickchoice', defaultMessage: "Hi, we've got a quick choice for you…" })}
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <VStack alignItems="flex-start">
                            {rawChoice === null ? (
                                <>
                                    <Text fontSize="lg">
                                        <FormattedMessage
                                            id="uxchoice.uxchoicedialog.welcome1"
                                            defaultMessage="New to Midspace? We recommend our new, simpler experience"
                                        />
                                    </Text>
                                    <Text fontSize="sm">
                                        <FormattedMessage
                                            id="uxchoice.uxchoicedialog.welcome2"
                                            defaultMessage="All the same features, just easier to navigate."
                                        />
                                    </Text>
                                    <Text fontSize="lg" pt={2}>
                                        <FormattedMessage
                                            id="uxchoice.uxchoicedialog.welcome3"
                                            defaultMessage="Used Midspace recently and would rather stick with the old version?"
                                        />
                                    </Text>
                                </>
                            ) : undefined}
                            <Text fontSize="sm">
                                <FormattedMessage
                                    id="uxchoice.uxchoicedialog.buttonmsg"
                                    defaultMessage="You can change your mind any time using the 'Switch UI' button in the Profile menu."
                                />
                            </Text>
                        </VStack>
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <HStack pt={2}>
                            <Button
                                colorScheme="pink"
                                onClick={() => {
                                    setChoice(UXChoice.V1);
                                    onClose();
                                }}
                                ml={3}
                            >
                                <FAIcon iconStyle="s" icon="arrow-down" mr={2} />
                                <FormattedMessage
                                    id="uxchoice.uxchoicedialog.oldxp"
                                    defaultMessage="Stick with the old"
                                />
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
                                <FormattedMessage
                                    id="uxchoice.uxchoicedialog.newxp"
                                    defaultMessage="Use the new experience"
                                />
                            </Button>
                        </HStack>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
}

import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Select,
    Text,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import type { Chat_FlagType_Enum } from "../../../generated/graphql";

function ReportMessageDialog({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: (info?: { type: Chat_FlagType_Enum; reason: string }) => void;
}): JSX.Element {
    const cancelRef = React.useRef<HTMLButtonElement | null>(null);
    const [type, setType] = useState<string>("Abusive");
    const [reason, setReason] = useState<string>("");

    return (
        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={() => onClose()}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Help us understand the problem.
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Why are you reporting this message?</FormLabel>
                                <Select value={type} onChange={(ev) => setType(ev.target.value)}>
                                    <option value="Abusive">It is abusive or harmful.</option>
                                    <option value="Spam">It is spam, suspicious or annoying.</option>
                                    <option value="Risk_To_Life">
                                        It expresses intentions of self-harm or suicide.
                                    </option>
                                    <option value="Misleading">It gives the wrong idea or impression.</option>
                                    <option value="Disinformation">
                                        It contains false information and is intended to mislead readers.
                                    </option>
                                </Select>
                                <FormHelperText>
                                    Please select the main reason you are reporting this message.
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel>What is going on with this message?</FormLabel>
                                <Input value={reason} onChange={(ev) => setReason(ev.target.value)} />
                                <FormHelperText>
                                    Please briefly explain why you are reporting this message.
                                </FormHelperText>
                            </FormControl>
                            <Text fontSize="sm">
                                After your report is submitted, it will be reviewed by the conference moderators or
                                organisers.
                            </Text>
                        </VStack>
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={() => onClose()}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="DestructiveActionButton"
                            isDisabled={!reason.length}
                            onClick={() => onClose({ type: type as Chat_FlagType_Enum, reason })}
                            ml={3}
                        >
                            Report
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
}

interface ReportMessageContext {
    open: (cb: (info?: { type: Chat_FlagType_Enum; reason: string }) => void) => void;
}

const ReportMessageContext = React.createContext<ReportMessageContext | undefined>(undefined);

export function useReportMessage(): ReportMessageContext {
    const ctx = React.useContext(ReportMessageContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function ReportMessageProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [callback, setCallback] = useState<{
        cb: (info?: { type: Chat_FlagType_Enum; reason: string }) => void;
    } | null>(null);
    const open = useCallback(
        (cb: (info?: { type: Chat_FlagType_Enum; reason: string }) => void) => {
            setCallback({ cb });
            onOpen();
        },
        [onOpen]
    );
    const close = useCallback(
        (info?: { type: Chat_FlagType_Enum; reason: string }) => {
            onClose();
            callback?.cb(info);
        },
        [onClose, callback]
    );
    const ctx = useMemo(
        () => ({
            open,
        }),
        [open]
    );

    return (
        <ReportMessageContext.Provider value={ctx}>
            {children}
            <ReportMessageDialog isOpen={isOpen} onClose={close} />
        </ReportMessageContext.Provider>
    );
}

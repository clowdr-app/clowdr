import {
    Box,
    Button,
    ButtonGroup,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    HStack,
    Input,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    ModalProps,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    OrderedList,
    Portal,
    Switch,
    Text,
    Tooltip,
    VStack,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import FAIcon from "../../../Icons/FAIcon";
import { useChatConfiguration } from "../../Configuration";
import type { MessageData, PollMessageData } from "../../Types/Messages";
import { useComposeContext } from "../ComposeContext";
import SendLockoutButton from "../SendLockoutButton";

export default function CreatePollOptionsModal({
    onCancel,
    onSend,
    initialData,
    sendFailed,
    ...props
}: Omit<ModalProps, "children" | "onClose"> & {
    onCancel: () => void;
    onSend: (
        data: Pick<
            PollMessageData,
            "options" | "canRegistrantsCreateOptions" | "revealBeforeComplete" | "maxVotesPerRegistrant"
        >
    ) => void;
    initialData: MessageData;
    sendFailed: boolean;
}): JSX.Element {
    const config = useChatConfiguration();
    const compose = useComposeContext();

    const [options, setOptions] = useState<string[]>("options" in initialData ? initialData.options : []);
    const [focusOnIdx, setFocusOnIdx] = useState<number | null>(null);
    const [canRegistrantsCreateOptions, setCanRegistrantsCreateOptions] = useState<boolean>(
        "canRegistrantsCreateOptions" in initialData ? initialData.canRegistrantsCreateOptions : false
    );
    const [revealBeforeComplete, setRevealBeforeComplete] = useState<boolean>(
        "revealBeforeComplete" in initialData ? initialData.revealBeforeComplete : false
    );
    const [maxVotesPerRegistrant, setMaxVotesPerRegistrant] = useState<number>(
        "maxVotesPerRegistrant" in initialData ? initialData.maxVotesPerRegistrant : 1
    );

    const focusRefs = useMemo(
        () => [...options.map((_) => React.createRef<HTMLInputElement>()), React.createRef<HTMLInputElement>()],
        [options]
    );

    const minNumOptions = config.pollConfig.numberOfAnswers?.min ?? 0;
    const maxNumOptions = config.pollConfig.numberOfAnswers?.max ?? 20;

    useEffect(() => {
        if (maxVotesPerRegistrant > options.length && options.length > 0) {
            setMaxVotesPerRegistrant(options.length);
        }
    }, [maxVotesPerRegistrant, options.length]);

    useEffect(() => {
        if (focusOnIdx !== null) {
            if (focusOnIdx < 0) {
                setFocusOnIdx(null);
            } else if (focusOnIdx < focusRefs.length) {
                setFocusOnIdx(null);
                const c = focusRefs[focusOnIdx].current;
                if (c) {
                    c.focus();
                    if (focusOnIdx < options.length) {
                        c.selectionStart = options[focusOnIdx].length;
                        c.selectionEnd = options[focusOnIdx].length;
                    }
                }
            }
        }
    }, [focusOnIdx, focusRefs, options]);

    return (
        <Modal
            isCentered
            {...props}
            onClose={() => {
                onCancel();
            }}
            scrollBehavior="inside"
        >
            <ModalOverlay />
            <Portal>
                <ModalContent>
                    <ModalHeader>Create poll options</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={6}>
                            <VStack w="100%" justifyContent="flex-start" alignItems="center">
                                <Heading as="h2" fontSize="md">
                                    Your question:
                                </Heading>
                                <Text as="p">{compose.newMessage}</Text>
                            </VStack>
                            <FormControl>
                                <FormLabel>Options</FormLabel>
                                <FormHelperText>
                                    Add or delete options by typing. Press enter when editing any choice to create a new
                                    option below it. You may also enable registrants to create their own options.
                                </FormHelperText>
                                <OrderedList mt={4} spacing={4}>
                                    {options.map((option, idx) => (
                                        <ListItem key={idx}>
                                            <Input
                                                minLength={config.pollConfig.answerLength?.min}
                                                maxLength={config.pollConfig.answerLength?.max}
                                                ref={focusRefs[idx]}
                                                aria-label="Edit this option. Leave option empty to remove."
                                                value={option}
                                                placeholder="Leave option empty to remove"
                                                onChange={(ev) => {
                                                    if (ev.target.value.length === 0) {
                                                        setFocusOnIdx(
                                                            idx > 0 ? idx - 1 : options.length > 0 ? 0 : null
                                                        );
                                                        setOptions((old) => [
                                                            ...old.slice(0, idx),
                                                            ...old.slice(idx + 1),
                                                        ]);
                                                    } else {
                                                        setOptions((old) => [
                                                            ...old.slice(0, idx),
                                                            ev.target.value,
                                                            ...old.slice(idx + 1),
                                                        ]);
                                                    }
                                                }}
                                                onBlur={(ev) => {
                                                    const v = ev.target.value.trim();
                                                    if (v.length === 0) {
                                                        setFocusOnIdx(
                                                            idx > 0 ? idx - 1 : options.length > 0 ? 0 : null
                                                        );
                                                        setOptions((old) => [
                                                            ...old.slice(0, idx),
                                                            ...old.slice(idx + 1),
                                                        ]);
                                                    } else if (v !== ev.target.value) {
                                                        setOptions((old) => [
                                                            ...old.slice(0, idx),
                                                            v,
                                                            ...old.slice(idx + 1),
                                                        ]);
                                                    }
                                                }}
                                                onKeyUp={(ev: React.KeyboardEvent<HTMLInputElement>) => {
                                                    if (
                                                        ev.key === "Enter" &&
                                                        (ev.target as any).value.length > 0 &&
                                                        options.length < maxNumOptions
                                                    ) {
                                                        setFocusOnIdx(idx + 1);
                                                        setOptions((old) => [
                                                            ...old.slice(0, idx + 1),
                                                            "",
                                                            ...old.slice(idx + 1),
                                                        ]);
                                                    } else if (
                                                        (ev.key === "Delete" || ev.key === "Backspace") &&
                                                        // Use the old option value so we don't delete it just when someone did Ctrl+A + Delete
                                                        option.length === 0
                                                    ) {
                                                        setFocusOnIdx(
                                                            idx > 0 ? idx - 1 : options.length > 0 ? 0 : null
                                                        );
                                                        setOptions((old) => [
                                                            ...old.slice(0, idx),
                                                            ...old.slice(idx + 1),
                                                        ]);
                                                    } else if (ev.key === "ArrowUp") {
                                                        ev.preventDefault();
                                                        ev.stopPropagation();
                                                    } else if (ev.key === "ArrowDown") {
                                                        ev.preventDefault();
                                                        ev.stopPropagation();
                                                    }
                                                }}
                                                onKeyDown={(ev: React.KeyboardEvent<HTMLInputElement>) => {
                                                    if (ev.key === "ArrowUp") {
                                                        setFocusOnIdx(idx - 1);
                                                        ev.preventDefault();
                                                        ev.stopPropagation();
                                                    } else if (ev.key === "ArrowDown") {
                                                        setFocusOnIdx(idx + 1);
                                                        ev.preventDefault();
                                                        ev.stopPropagation();
                                                    }
                                                }}
                                            />
                                            {config.pollConfig.answerLength?.min !== undefined &&
                                            option.length < config.pollConfig.answerLength.min ? (
                                                <Text as="span" color="red.400" fontSize="0.9em">
                                                    Minimum {config.pollConfig.answerLength.min} characters.
                                                </Text>
                                            ) : undefined}
                                        </ListItem>
                                    ))}
                                    {options.length < maxNumOptions ? (
                                        <ListItem key="add-option">
                                            <Input
                                                ref={focusRefs[focusRefs.length - 1]}
                                                aria-label="Add a choice by typing and pressing enter"
                                                placeholder="Add a choice..."
                                                value={""}
                                                onChange={(ev) => {
                                                    setFocusOnIdx(options.length);
                                                    setOptions((old) => [...old, ev.target.value]);
                                                }}
                                                onKeyUp={(ev: React.KeyboardEvent<HTMLInputElement>) => {
                                                    if (ev.key === "ArrowUp") {
                                                        setFocusOnIdx(options.length - 1);
                                                    }
                                                }}
                                            />
                                        </ListItem>
                                    ) : undefined}
                                </OrderedList>
                            </FormControl>
                            {options.length < minNumOptions ? (
                                <Text as="p" color="red.400">
                                    Please create at least {minNumOptions} option{minNumOptions !== 1 ? "s" : ""}
                                </Text>
                            ) : undefined}
                            {options.length >= maxNumOptions ? (
                                <Text as="p" color="blue.400">
                                    Maximum {maxNumOptions} option{maxNumOptions !== 1 ? "s" : ""}
                                </Text>
                            ) : undefined}
                            <FormControl>
                                <FormLabel fontWeight="semibold">Allow registrants to create options?</FormLabel>
                                <HStack>
                                    <Text as="span">No</Text>
                                    <Switch
                                        isChecked={canRegistrantsCreateOptions}
                                        onChange={(ev) => setCanRegistrantsCreateOptions(ev.target.checked)}
                                    />
                                    <Text as="span">Yes</Text>
                                </HStack>
                                <FormHelperText>
                                    Would you like to allow registrants to create their own options?
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel fontWeight="semibold">Reveal choices live?</FormLabel>
                                <HStack>
                                    <Text as="span">Hide until complete</Text>
                                    <Switch
                                        isChecked={revealBeforeComplete}
                                        onChange={(ev) => setRevealBeforeComplete(ev.target.checked)}
                                    />
                                    <Text as="span">Reveal live</Text>
                                </HStack>
                                <FormHelperText>
                                    Do you wish to reveal votes live or hide them until you mark the poll complete?
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel fontWeight="semibold">Max choices per registrant?</FormLabel>
                                <NumberInput
                                    value={maxVotesPerRegistrant}
                                    onChange={(_, v) =>
                                        Number.isNaN(v) ? setMaxVotesPerRegistrant(1) : setMaxVotesPerRegistrant(v)
                                    }
                                    min={0}
                                    max={options.length > 0 ? options.length : 1}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper aria-label="Increment" />
                                        <NumberDecrementStepper aria-label="Decrement" />
                                    </NumberInputStepper>
                                </NumberInput>
                                <FormHelperText>
                                    How many votes can each registrant cast? Set to 0 for no limit.
                                </FormHelperText>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <ButtonGroup>
                            <Button onClick={() => onCancel()}>Cancel</Button>
                            <Tooltip
                                label={
                                    options.length < minNumOptions
                                        ? `Minimum ${minNumOptions} option${minNumOptions !== 1 ? "s" : ""}`
                                        : undefined
                                }
                            >
                                <Box>
                                    <SendLockoutButton
                                        sendFailed={sendFailed}
                                        backgroundColor="blue.500"
                                        color="white"
                                        _hover={{
                                            backgroundColor: "blue.600",
                                        }}
                                        _focus={{
                                            backgroundColor: "blue.600",
                                        }}
                                        _active={{
                                            backgroundColor: "blue.800",
                                        }}
                                        onClick={() => {
                                            onSend({
                                                options,
                                                canRegistrantsCreateOptions,
                                                maxVotesPerRegistrant,
                                                revealBeforeComplete,
                                            });
                                            setOptions([]);
                                        }}
                                        isDisabled={options.length < (config.pollConfig.numberOfAnswers?.min ?? 0)}
                                    >
                                        <FAIcon iconStyle="s" icon="paper-plane" mr={2} aria-hidden /> Send
                                    </SendLockoutButton>
                                </Box>
                            </Tooltip>
                        </ButtonGroup>
                    </ModalFooter>
                </ModalContent>
            </Portal>
        </Modal>
    );
}

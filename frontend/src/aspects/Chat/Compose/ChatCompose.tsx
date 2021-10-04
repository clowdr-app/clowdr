import {
    Box,
    BoxProps,
    Code,
    Flex,
    Text,
    Textarea,
    Tooltip,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { Chat_MessageType_Enum } from "../../../generated/graphql";
import { ChatSpacing, useChatConfiguration } from "../Configuration";
import type { AnswerMessageData } from "../Types/Messages";
import { useComposeContext } from "./ComposeContext";
import { InsertEmojiButton } from "./InsertEmojiButton";
import { MessageTypeButtons } from "./MessageTypeButtons";
import { CreatePollOptionsButton } from "./Poll/CreatePollOptionsButton";
import QuickSendEmote from "./QuickSendEmote";
import { SendMessageButton } from "./SendMessageButton";

export function ChatCompose({ ...rest }: BoxProps): JSX.Element {
    const config = useChatConfiguration();
    const cappedSpacing = Math.min(config.spacing, ChatSpacing.COMFORTABLE);

    const composeCtx = useComposeContext();
    const composeBoxRef = React.useRef<HTMLTextAreaElement | null>(null);

    const messageTypeMoniker =
        composeCtx.newMessageType === Chat_MessageType_Enum.Poll
            ? "poll question. Set choices using the button in the bottom-right."
            : composeCtx.newMessageType.toLowerCase();

    const toast = useToast();
    const onPollOptionsModalOpenRef = useRef<{
        onOpen: () => void;
    }>({
        onOpen: () => {
            /*EMPTY*/
        },
    });

    const [sendFailed, setSendFailed] = useState<string | number | null>(null);
    const failedToSend_BgColor = useColorModeValue("ChatError.backgroundColor-light", "ChatError.backgroundColor-dark");
    const failedToSend_TextColor = useColorModeValue("ChatError.textColor-light", "ChatError.textColor-dark");
    useEffect(() => {
        let tId: number | undefined;
        if (composeCtx.sendError && sendFailed === null) {
            const toastId = toast({
                description: (
                    <VStack alignItems="flex-start">
                        <Text as="p">
                            Sorry, your message failed to send. Please try again in a moment. If the error noted below
                            persists, please contact our technical support.
                        </Text>
                        <Text as="pre" bgColor={failedToSend_BgColor}>
                            <Code color={failedToSend_TextColor}>{composeCtx.sendError}</Code>
                        </Text>
                    </VStack>
                ),
                isClosable: true,
                position: "bottom-right",
                status: "error",
                title: "Failed to send",
            });
            setSendFailed(toastId ?? null);
            setTimeout(() => {
                setSendFailed(null);
            }, 1000);
        }
        return () => {
            if (tId) {
                clearTimeout(tId);
            }
        };
    }, [composeCtx, composeCtx.sendError, failedToSend_BgColor, failedToSend_TextColor, sendFailed, toast]);

    useEffect(() => {
        if (
            composeCtx.newMessageType === Chat_MessageType_Enum.Answer &&
            (composeCtx.newMessageData as AnswerMessageData).questionMessagesIds
        ) {
            composeBoxRef.current?.focus();
        }
    }, [composeBoxRef, composeCtx.newMessageData, composeCtx.newMessageType]);

    const [wasSending, setWasSending] = useState<boolean>(true);
    useEffect(() => {
        if (wasSending && !composeCtx.isSending) {
            composeBoxRef.current?.focus();
        }
        setWasSending(composeCtx.isSending);
    }, [composeCtx.isSending, wasSending]);

    const borderColour = useColorModeValue("ChatCompose.borderColor-light", "ChatCompose.borderColor-dark");
    const borderColourFaded = useColorModeValue(
        "ChatCompose.borderColorFaded-light",
        "ChatCompose.borderColorFaded-dark"
    );
    return (
        <VStack
            spacing={0}
            justifyContent="center"
            alignItems="flex-start"
            pos="relative"
            p="1px"
            borderTop="1px solid"
            borderTopColor={borderColour}
            {...rest}
        >
            <QuickSendEmote />
            <MessageTypeButtons isDisabled={composeCtx.isSending} w="100%" />
            <Box pos="relative" w="100%" h="auto" borderTop="1px solid" borderTopColor={borderColourFaded} pt="1px">
                <Textarea
                    ref={composeBoxRef}
                    fontSize={config.fontSizeRange.value}
                    borderRadius={0}
                    border="none"
                    p={cappedSpacing}
                    aria-label={`Compose your ${messageTypeMoniker}`}
                    placeholder={`Compose your ${messageTypeMoniker}`}
                    onChange={(ev) => {
                        composeCtx.setNewMessage(ev.target.value);
                    }}
                    value={composeCtx.newMessage}
                    min={composeCtx.messageLengthRange.min}
                    max={composeCtx.messageLengthRange.max}
                    autoFocus
                    isDisabled={composeCtx.isSending}
                    onKeyDown={(ev) => {
                        if (ev.key === "Enter" && !ev.shiftKey) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            if (composeCtx.newMessageType === Chat_MessageType_Enum.Poll) {
                                onPollOptionsModalOpenRef.current?.onOpen();
                            } else if (composeCtx.readyToSend) {
                                composeCtx.send();
                            } else if (composeCtx.newMessage.length > 0 && composeCtx.blockedReason) {
                                toast({
                                    id: "chat-compose-blocked-reason",
                                    isClosable: true,
                                    duration: 1500,
                                    position: "bottom-right",
                                    description: composeCtx.blockedReason,
                                    status: "info",
                                });
                            }
                        }
                    }}
                    _disabled={{
                        cursor: "progress",
                        opacity: 0.4,
                    }}
                    transition="none"
                />
                {/* <MessageTypeIndicator
                    messageType={composeCtx.newMessageType}
                    pos="absolute"
                    top={0}
                    right={cappedSpacing}
                    transform="translate(0, calc(-100% - 3px))"
                    opacity={0.7}
                /> */}
            </Box>
            <Flex w="100%" minH="2.4em">
                {composeCtx.newMessageType === Chat_MessageType_Enum.Answer ? (
                    <Flex
                        fontSize={config.fontSizeRange.value * 0.7}
                        overflowWrap="break-word"
                        whiteSpace="break-spaces"
                        p={0}
                        mx="auto"
                        justifyContent="center"
                        alignItems="center"
                        w="100%"
                    >
                        <Text
                            as="span"
                            h="auto"
                            borderColor="gray.400"
                            borderWidth={1}
                            borderStyle="solid"
                            borderRadius={10}
                            display="inline-block"
                            p={1}
                        >
                            {(composeCtx.newMessageData as AnswerMessageData).questionMessagesIds &&
                            (composeCtx.newMessageData as AnswerMessageData).questionMessagesIds?.[0]
                                ? "Answering message"
                                : //     `Answering message ${
                                //       (composeCtx.newMessageData as AnswerMessageData).questionMessagesIds?.[0]
                                //   }`
                                (composeCtx.newMessageData as AnswerMessageData).questionMessagesIds &&
                                  (composeCtx.newMessageData as AnswerMessageData).questionMessagesSIds?.[0]
                                ? "Answering message"
                                : //         `Answering message ${
                                  //       (composeCtx.newMessageData as AnswerMessageData).questionMessagesSIds?.[0]?.split(
                                  //           "-"
                                  //       )[0]
                                  //   }`
                                  "Select a question to answer"}
                        </Text>
                    </Flex>
                ) : undefined}
                <InsertEmojiButton
                    ml="auto"
                    onSelect={(data: any) => {
                        // TODO: Not sure why emoji-mart don't include the "native" property in their types
                        const emoji = (data as { native: string }).native;
                        composeCtx.setNewMessage(composeCtx.newMessage + emoji);
                    }}
                    isDisabled={composeCtx.isSending}
                />
                <Tooltip label={composeCtx.blockedReason}>
                    <Box m="3px" tabIndex={0}>
                        {composeCtx.newMessageType === Chat_MessageType_Enum.Poll ? (
                            <CreatePollOptionsButton
                                sendFailed={sendFailed !== null}
                                m={0}
                                onOpenRef={onPollOptionsModalOpenRef}
                                isDisabled={!composeCtx.readyToSend}
                                isLoading={composeCtx.isSending}
                            />
                        ) : (
                            <SendMessageButton
                                sendFailed={sendFailed !== null}
                                isDisabled={!composeCtx.readyToSend}
                                isLoading={composeCtx.isSending}
                                onClick={() => {
                                    composeCtx.send();
                                }}
                            />
                        )}
                    </Box>
                </Tooltip>
            </Flex>
        </VStack>
    );
}

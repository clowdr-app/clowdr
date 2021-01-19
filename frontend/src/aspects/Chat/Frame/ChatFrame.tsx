import { Box, BoxProps, VStack } from "@chakra-ui/react";
import React from "react";
import { ChatCompose } from "../Compose/ChatCompose";
import { ComposeContextProvider } from "../Compose/ComposeContext";
import SendMessageQueriesProvider from "../Compose/SendMessageQueries";
import { useChatConfiguration } from "../Configuration";
import { ChatConfigurationControls } from "../Heading/ChatConfigurationControl";
import { ChatHeading } from "../Heading/ChatHeading";
import { ChatSelector } from "../Heading/ChatSelector";
import { ChatMessageList } from "../Messages/ChatMessageList";
import EmojiPickerProvider from "../Messages/EmojiPickerProvider";
import ReactionsProvider from "../Messages/ReactionsProvider";
import ReceiveMessageQueriesProvider from "../Messages/ReceiveMessageQueries";
import { useSelectedChat } from "../SelectedChat";
import ChatProfileModalProvider from "./ChatProfileModalProvider";
import { ChatTypingIndicators } from "./ChatTypingIndicators";

export function ChatFrame({ ...rest }: BoxProps): JSX.Element {
    const config = useChatConfiguration();
    const selectedChat = useSelectedChat();
    const setAnsweringQuestionIdRef = React.useRef<{
        f: (ids: number[] | null) => void;
        answeringIds: number[] | null;
    }>({
        f: () => {
            /* EMPTY */
        },
        answeringIds: null,
    });

    return (
        <Box h="100%" w="100%" maxH="90vh" pos="relative" m={0} p={0} {...rest}>
            <VStack
                minH="100%"
                h="100%"
                w="100%"
                m={0}
                p={0}
                spacing={0}
                alignItems="stretch"
                fontSize={config.fontSizeRange.value + "px" ?? "1rem"}
            >
                <ChatHeading role="region" aria-label="Chat controls" flex="0 0 auto" />
                <ChatSelector flex="0 0 auto" />
                <ChatProfileModalProvider>
                    <ReactionsProvider>
                        <EmojiPickerProvider>
                            <Box
                                role="region"
                                aria-label="Messages"
                                flex="0 1 100%"
                                pos="relative"
                                overflow="hidden"
                                minH="400px"
                            >
                                {"chatId" in config.sources ? (
                                    <ReceiveMessageQueriesProvider
                                        chatId={config.sources.chatId}
                                        setAnsweringQuestionId={setAnsweringQuestionIdRef}
                                    >
                                        <ChatMessageList
                                            chatId={config.sources.chatId}
                                            pos="relative"
                                            h="100%"
                                            zIndex={1}
                                        />
                                    </ReceiveMessageQueriesProvider>
                                ) : (
                                    <>
                                        <ReceiveMessageQueriesProvider
                                            chatId={config.sources.chatIdL}
                                            setAnsweringQuestionId={setAnsweringQuestionIdRef}
                                        >
                                            <ChatMessageList
                                                chatId={config.sources.chatIdL}
                                                pos="absolute"
                                                top="0"
                                                left={selectedChat.selectedSide === "L" ? "0%" : "-100%"}
                                                w="100%"
                                                h="100%"
                                                zIndex={1}
                                                transition="left 0.2s linear"
                                                visibility={selectedChat.selectedSide === "L" ? "visible" : "hidden"}
                                            />
                                        </ReceiveMessageQueriesProvider>
                                        <ReceiveMessageQueriesProvider
                                            chatId={config.sources.chatIdR}
                                            setAnsweringQuestionId={setAnsweringQuestionIdRef}
                                        >
                                            <ChatMessageList
                                                chatId={config.sources.chatIdR}
                                                pos="absolute"
                                                top="0"
                                                left={selectedChat.selectedSide === "R" ? "0%" : "100%"}
                                                w="100%"
                                                h="100%"
                                                zIndex={1}
                                                transition="left 0.2s linear"
                                                visibility={selectedChat.selectedSide === "R" ? "visible" : "hidden"}
                                            />
                                        </ReceiveMessageQueriesProvider>
                                    </>
                                )}
                                <ChatConfigurationControls pos="absolute" top="0" left="0" w="100%" zIndex={2} />
                            </Box>
                        </EmojiPickerProvider>
                    </ReactionsProvider>
                </ChatProfileModalProvider>
                {config.currentAttendeeId &&
                (config.permissions.canMessage ||
                    config.permissions.canEmote ||
                    config.permissions.canReact ||
                    config.permissions.canQuestion ||
                    config.permissions.canAnswer ||
                    config.permissions.canPoll) ? (
                    <>
                        <ChatTypingIndicators flex="0 0 auto" />
                        <SendMessageQueriesProvider>
                            <ComposeContextProvider setAnsweringQuestionIdRef={setAnsweringQuestionIdRef}>
                                <ChatCompose role="region" aria-label="Compose message" flex="0 0 auto" />
                            </ComposeContextProvider>
                        </SendMessageQueriesProvider>
                    </>
                ) : undefined}
            </VStack>
        </Box>
    );
}

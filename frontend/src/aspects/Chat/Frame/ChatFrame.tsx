import { Box, BoxProps, VStack } from "@chakra-ui/react";
import React from "react";
import { ChatCompose } from "../Compose/ChatCompose";
import { ComposeContextProvider } from "../Compose/ComposeContext";
import SendMessageQueriesProvider from "../Compose/SendMessageQueries";
import { useChatConfiguration } from "../Configuration";
import { ChatConfigurationControls } from "../Heading/ChatConfigurationControl";
import { ChatHeading } from "../Heading/ChatHeading";
import { ChatMessageList } from "../Messages/ChatMessageList";
import EmojiPickerProvider from "../Messages/EmojiPickerProvider";
import ReceiveMessageQueriesProvider from "../Messages/ReceiveMessageQueries";
import ChatProfileModalProvider from "./ChatProfileModalProvider";
import { ChatTypingIndicators } from "./ChatTypingIndicators";

export function ChatFrame({ ...rest }: BoxProps): JSX.Element {
    const config = useChatConfiguration();
    const setAnsweringQuestionSIdRef = React.useRef<{
        f: (sIds: string[] | null) => void;
        answeringSIds: string[] | null;
    }>({
        f: () => {
            /* EMPTY */
        },
        answeringSIds: null,
    });

    return (
        <Box h="100%" w="100%" pos="relative" m={0} p={0} {...rest}>
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
                {/* <ChatSelector flex="0 0 auto" /> */}
                <ChatProfileModalProvider>
                    <EmojiPickerProvider>
                        <ReceiveMessageQueriesProvider setAnsweringQuestionSId={setAnsweringQuestionSIdRef}>
                            <Box role="region" aria-label="Messages" flex="0 1 100%" pos="relative" overflow="hidden">
                                <ChatMessageList pos="relative" h="100%" zIndex={1} />
                                <ChatConfigurationControls pos="absolute" top="0" left="0" w="100%" zIndex={2} />
                            </Box>
                        </ReceiveMessageQueriesProvider>
                    </EmojiPickerProvider>
                </ChatProfileModalProvider>
                {config.currentRegistrantId &&
                (config.permissions.canMessage ||
                    config.permissions.canEmote ||
                    config.permissions.canReact ||
                    config.permissions.canQuestion ||
                    config.permissions.canAnswer ||
                    config.permissions.canPoll) ? (
                    <>
                        <ChatTypingIndicators flex="0 0 auto" />
                        <SendMessageQueriesProvider>
                            <ComposeContextProvider setAnsweringQuestionSIdRef={setAnsweringQuestionSIdRef}>
                                <ChatCompose role="region" aria-label="Compose message" flex="0 0 auto" />
                            </ComposeContextProvider>
                        </SendMessageQueriesProvider>
                    </>
                ) : undefined}
            </VStack>
        </Box>
    );
}

import type { BoxProps} from "@chakra-ui/react";
import { Box, VStack } from "@chakra-ui/react";
import type { RefObject } from "react";
import React from "react";
import { ChatCompose } from "../Compose/ChatCompose";
import { ComposeContextProvider } from "../Compose/ComposeContext";
import SendMessageQueriesProvider from "../Compose/SendMessageQueries";
import { useChatConfiguration } from "../Configuration";
import EmojiPickerProvider from "../EmojiPickerProvider";
import { ChatHeading } from "../Heading/ChatHeading";
import { ChatMessageList } from "../Messages/ChatMessageList";
import ReceiveMessageQueriesProvider from "../Messages/ReceiveMessageQueries";
import ChatProfileModalProvider from "./ChatProfileModalProvider";

export function ChatFrame({ isVisible, ...rest }: { isVisible: RefObject<boolean> } & BoxProps): JSX.Element {
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
                <EmojiPickerProvider>
                    <ChatHeading role="region" aria-label="Chat controls" flex="0 0 auto" />
                    {/* <ChatSelector flex="0 0 auto" /> */}
                    <ChatProfileModalProvider>
                        <ReceiveMessageQueriesProvider setAnsweringQuestionSId={setAnsweringQuestionSIdRef}>
                            <Box
                                pb={2}
                                role="region"
                                aria-label="Messages"
                                flex="0 1 100%"
                                pos="relative"
                                overflow="hidden"
                            >
                                <ChatMessageList pos="relative" h="100%" zIndex={1} isVisible={isVisible} />
                            </Box>
                        </ReceiveMessageQueriesProvider>
                    </ChatProfileModalProvider>
                    {config.currentRegistrantId &&
                    (config.permissions.canMessage ||
                        config.permissions.canEmote ||
                        config.permissions.canReact ||
                        config.permissions.canQuestion ||
                        config.permissions.canAnswer ||
                        config.permissions.canPoll) ? (
                        <>
                            {/* TODO: <ChatTypingIndicators flex="0 0 auto" /> */}
                            <SendMessageQueriesProvider>
                                <ComposeContextProvider setAnsweringQuestionSIdRef={setAnsweringQuestionSIdRef}>
                                    <ChatCompose role="region" aria-label="Compose message" flex="0 0 auto" />
                                </ComposeContextProvider>
                            </SendMessageQueriesProvider>
                        </>
                    ) : undefined}
                </EmojiPickerProvider>
            </VStack>
        </Box>
    );
}

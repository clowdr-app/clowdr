import { Box, BoxProps, ButtonGroup, HStack } from "@chakra-ui/react";
import React from "react";
import { useChatConfiguration } from "../Configuration";
import { PinnedButton } from "../Pin/PinnedButton";
import { ChatPinnedQueryProvider } from "../Pin/PinnedQuery";
import { SubscribedButton } from "../Subscribe/SubscribedButton";
import { ChatSubscribedQueryProvider } from "../Subscribe/SubscribedQuery";
import { ChatConfigurationControls } from "./ChatConfigurationControl";
import { HeadingText } from "./HeadingText";

export function ChatHeading({ ...rest }: BoxProps): JSX.Element {
    const config = useChatConfiguration();

    return (
        <Box p="5px" {...rest}>
            <HStack spacing={config.spacing} overflow="hidden" alignItems="flex-start">
                {config.customHeadingElements}
                <HeadingText />
                {/* <Spacer /> */}
                {/* <PageCountBox /> */}
                <ChatConfigurationControls pos="absolute" top="0" left="0" w="100%" zIndex={2} />
                {config.currentRegistrantId ? (
                    <>
                        <ButtonGroup isAttached borderRadius={5} overflow="hidden">
                            <ChatPinnedQueryProvider>
                                <PinnedButton
                                    opacity={0.8}
                                    _hover={{
                                        opacity: 1,
                                    }}
                                    _focus={{
                                        opacity: 1,
                                    }}
                                    transition="opacity 0.2s ease-in-out"
                                    size="xs"
                                    m={0}
                                    p={config.spacing}
                                    w="auto"
                                    h="auto"
                                    minH="100%"
                                    borderRadius="0"
                                    colorScheme="purple"
                                    fontSize="1em"
                                />
                            </ChatPinnedQueryProvider>
                            <ChatSubscribedQueryProvider>
                                <SubscribedButton
                                    opacity={0.8}
                                    _hover={{
                                        opacity: 1,
                                    }}
                                    _focus={{
                                        opacity: 1,
                                    }}
                                    transition="opacity 0.2s ease-in-out"
                                    size="xs"
                                    m={0}
                                    p={config.spacing}
                                    w="auto"
                                    h="auto"
                                    minH="100%"
                                    borderRadius="0"
                                    colorScheme="orange"
                                    fontSize="1em"
                                />
                            </ChatSubscribedQueryProvider>
                        </ButtonGroup>
                    </>
                ) : undefined}
            </HStack>
        </Box>
    );
}

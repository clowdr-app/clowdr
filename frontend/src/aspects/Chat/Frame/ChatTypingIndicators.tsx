import { Flex, FlexProps, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { useChatConfiguration } from "../Configuration";

export function ChatTypingIndicators({ ...rest }: FlexProps): JSX.Element {
    const config = useChatConfiguration();
    const colour = useColorModeValue("gray.400", "gray.400");

    return (
        <Flex
            flexDir="column"
            justifyContent="flex-end"
            minH="3.8ex"
            fontStyle="italic"
            color={colour}
            fontSize={config.fontSizeRange.value * 0.7}
            p={0}
            pb="2px"
            w={`calc(100% - 1em - 15px - ${config.spacing}px)`}
            {...rest}
        >
            {/* <Text as="span">Chat typing indicators: TODO</Text> */}
        </Flex>
    );
}

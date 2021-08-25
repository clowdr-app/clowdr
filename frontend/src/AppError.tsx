import { Button, chakra, Code, Text, VStack } from "@chakra-ui/react";
import React, { PropsWithChildren, useState } from "react";
import type { FallbackProps } from "react-error-boundary";

export function AppError(props: PropsWithChildren<FallbackProps>): JSX.Element {
    const [now] = useState(Date.now());
    return (
        <VStack m="24px" maxHeight="calc(100vh - 48px)" overflowY="auto">
            <Text fontSize="1.2em">Sorry, Midspace ran into a problem. Please try refreshing the page.</Text>
            <Text pb="6px">If you report this error, please include the following details:</Text>
            <VStack alignItems="left" p="8px" bgColor="#eee" maxH="80vh" overflowY="auto" maxWidth="100%">
                <Code>
                    {props.error.name}: {props.error.message}
                </Code>
                <Code>Time: {now}</Code>
                <Code>Location: {window.location.href}</Code>
                <chakra.pre my="4px" fontSize="0.8em">
                    {props.error.stack}
                </chakra.pre>
            </VStack>
            <Button
                onClick={() => window.location.reload(false)}
                bgColor="#eee"
                p="12px"
                border="1px solid black"
                borderRadius="4px"
                fontSize="1.2em"
            >
                Refresh
            </Button>
            <chakra.a href="/">Return to home</chakra.a>
        </VStack>
    );
}

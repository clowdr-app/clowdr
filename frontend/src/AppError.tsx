import { Button, chakra, Text, VStack } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";
import React, { useMemo } from "react";
import type { FallbackProps } from "react-error-boundary";
import { hasOwnProperty } from "./aspects/Generic/ObjectUtils";

export function AppError({ error }: PropsWithChildren<FallbackProps>): JSX.Element {
    const now = useMemo(() => Date.now(), []);
    const graphQlErrors = hasOwnProperty(error, "graphQLErrors") ? error.graphQLErrors : null;

    return (
        <VStack m="24px" maxHeight="calc(100vh - 48px)" overflowY="auto">
            <Text fontSize="1.2em">Sorry, Midspace ran into a problem. Please try refreshing the page.</Text>
            <Text pb="6px">If you report this error, please include the following details:</Text>
            <chakra.pre w="80%" maxW="120ch" bgColor="gray.200" p={4} overflow="auto">
                {`${error.name}: ${error.message}

Time: ${now}
Location: ${window.location.href}

${graphQlErrors ? `GraphQL: ${JSON.stringify(graphQlErrors)}` : ""}

${error.stack}`}
            </chakra.pre>
            <Button
                onClick={() => window.location.reload()}
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

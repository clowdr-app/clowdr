import { Button, chakra, Code, Text, VStack } from "@chakra-ui/react";
import React, { PropsWithChildren, useState } from "react";
import type { FallbackProps } from "react-error-boundary";
import { FAIcon } from "../../../../Icons/FAIcon";

export function HlsPlayerError(props: PropsWithChildren<FallbackProps>): JSX.Element {
    const [now] = useState(Date.now());
    return (
        <VStack height="100%" width="100%" borderColor="black" borderWidth={2} p={4}>
            <FAIcon iconStyle="s" icon="file-video" fontSize="6xl" color="red.500" />
            <Text>The video player encountered an issue. Please refresh the page.</Text>
            <Text pb="6px">If you report this error, please include the following details:</Text>
            <VStack alignItems="left" p="8px" bgColor="#eee" maxH="40em" maxW="100%" overflow="auto">
                <Code>
                    [HlsPlayer] {props.error.name}: {props.error.message}
                </Code>
                <Code>Time: {now}</Code>
                <Code>Location: {window.location.href}</Code>
                <chakra.pre my="4px" fontSize="0.8em">
                    {props.error.stack}
                </chakra.pre>
            </VStack>
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
        </VStack>
    );
}

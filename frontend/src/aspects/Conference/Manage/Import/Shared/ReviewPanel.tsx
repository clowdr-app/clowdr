import { Box, Button, Code, Text } from "@chakra-ui/react";
import type { IntermediaryContentData } from "@midspace/shared-types/import/intermediary";
import React from "react";
import JSONataQueryModal from "../../../../Files/JSONataQueryModal";
import FAIcon from "../../../../Icons/FAIcon";

export default function ReviewPanel<T = IntermediaryContentData>({
    data,
    defaultQuery,
}: {
    data: Record<string, T>;
    defaultQuery: string;
}): JSX.Element {
    return (
        <>
            <JSONataQueryModal data={data} defaultQuery={defaultQuery} />
            <Box pt={2} position="relative">
                <Button
                    aria-label="Copy output data"
                    position="absolute"
                    top={2}
                    right={0}
                    colorScheme="purple"
                    onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    }}
                >
                    <FAIcon iconStyle="r" icon="clipboard" />
                </Button>
                <Text as="pre" w="100%" overflowWrap="break-word" whiteSpace="pre-wrap">
                    <Code w="100%" p={2}>
                        {JSON.stringify(data, null, 2)}
                    </Code>
                </Text>
            </Box>
        </>
    );
}

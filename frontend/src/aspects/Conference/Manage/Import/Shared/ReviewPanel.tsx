import { Box, Button, Code, Text } from "@chakra-ui/react";
import type { IntermediaryRegistrantData } from "@midspace/shared-types/import/registrant";
import React from "react";
import FAIcon from "../../../../Chakra/FAIcon";
import JSONataQueryModal from "../../../../Files/JSONataQueryModal";

export default function ReviewPanel({
    data,
    defaultQuery,
}: {
    data: Record<string, IntermediaryRegistrantData[]>;
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

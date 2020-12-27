import { Box, Button, Code, Text } from "@chakra-ui/react";
import type { IntermediaryData } from "@clowdr-app/shared-types/build/import/intermediary";
import React from "react";
import JSONataQueryModal from "../../../../Files/JSONataQueryModal";
import FAIcon from "../../../../Icons/FAIcon";

const defaultQuery = `
(
    $researchrPapers := $.'2020-12-25 - Researchr.xml'.groups;
    $hotCRPPapers := $.'popl21-data-2.json'.groups;
    $researchrTitles := $distinct([$researchrPapers ["Research Papers" in tagNames].$lowercase(title)]);
    $hotCRPTitles := $distinct([$hotCRPPapers.$lowercase(title)]);
    $expectedHotCRPMissing := [
      "break",
      "welcome",
      "the road to a universal internet machine (demystifying blockchain protocols)",
      "robin milner award",
      "toward a programmable cloud: calm foundations and open challenges",
      "dynamical systems and program analysis",
      "structured social",
      "test of time award",
      "business meeting & townhall"
    ];
{
    "missing_from": {
        "researchr": [$hotCRPTitles[$not($ in $researchrTitles)]],
        "hotCRP": [$researchrTitles[$not($ in $hotCRPTitles or $ in $expectedHotCRPMissing)]]
    },
    "matching": [$hotCRPTitles[$ in $researchrTitles]],

    "researchrTitles": $researchrTitles,
    "hotCRPTitles": $hotCRPTitles
})
`;

export default function ReviewPanel({ data }: { data: Record<string, IntermediaryData> }): JSX.Element {
    // TODO: A proper merge function
    const mergedData = data;
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
                        navigator.clipboard.writeText(JSON.stringify(mergedData, null, 2));
                    }}
                >
                    <FAIcon iconStyle="r" icon="clipboard" />
                </Button>
                <Text as="pre" w="100%" overflowWrap="break-word" whiteSpace="pre-wrap">
                    <Code w="100%" p={2}>
                        {JSON.stringify(mergedData, null, 2)}
                    </Code>
                </Text>
            </Box>
        </>
    );
}

import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Code,
    Link,
    Select,
    Spinner,
    Text,
    VStack,
    Wrap,
    WrapItem,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import FAIcon from "../../../../Chakra/FAIcon";
import { DownloadButton, ExternalLinkButton } from "../../../../Chakra/LinkButton";
import useCSVJSONXMLFileSelector from "../../../../Files/useCSVJSONXMLFileSelector";
import useCSVJSONXMLImportOptions from "../../../../Files/useCSVJSONXMLImportOptions";
import type { ParsedData, ParserResult } from "../../../../Files/useCSVJSONXMLParser";
import useCSVJSONXMLParse from "../../../../Files/useCSVJSONXMLParser";

function parser(data: any): ParserResult<any[]> {
    // Researchr XML
    if (data.subevent) {
        data = data.subevent;
    }

    // if (!(data instanceof Array)) {
    //     return {
    //         ok: false,
    //         error: "Data should be a list of items.",
    //     };
    // }

    return {
        ok: true,
        data,
    };
}

export default function DataPanel({
    onData,
}: {
    onData?: (data: ParsedData<any[]>[] | undefined) => void;
}): JSX.Element {
    const { acceptedFiles, component: fileImporterEl } = useCSVJSONXMLFileSelector();
    const { importOptions, replaceImportOptions, openOptionsButton, optionsComponent } =
        useCSVJSONXMLImportOptions(acceptedFiles);
    const { data } = useCSVJSONXMLParse(importOptions, parser);

    useEffect(() => {
        let newOptionsChanged = false;

        if (data) {
            const newOptions = importOptions.map((x) => ({ ...x }));
            for (const aData of data) {
                if ("error" in aData) {
                    // Excel seems to save CSVs as ANSI encoded by default,
                    // so we accomodate this common exception case automatically
                    if (aData.error === "TextDecoder.decode: Decoding failed.") {
                        const options = newOptions.find((x) => x.file.name === aData.fileName);
                        if (options?.encoding === "utf-8" || options?.encoding === "utf8") {
                            options.encoding = "ansi_x3.4-1968";
                            newOptionsChanged = true;
                        }
                    }
                }
            }

            if (newOptionsChanged) {
                replaceImportOptions(newOptions);
            }
        }

        if (!newOptionsChanged) {
            onData?.(data);
        }
    }, [data, importOptions, onData, replaceImportOptions]);
    const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);

    const selectedData =
        data && selectedFileIndex >= 0 && selectedFileIndex < data.length ? data[selectedFileIndex] : undefined;

    return (
        <>
            <VStack w="100%" align="flex-start" spacing={4}>
                <Text>
                    Get help{" "}
                    <Link isExternal href="https://resources.midspace.app/organizer-guides/getting-started/import-registrants/">
                        importing your registrants
                    </Link>
                </Text>
                <Wrap align="center" spacing={4}>
                    <WrapItem>
                        <DownloadButton
                            to="https://docs.google.com/spreadsheets/d/1XtQJPts8h59LNdIsShKRLMj4QndP97aC/export?format=xlsx"
                            isExternal
                        >
                            Download Template
                        </DownloadButton>
                    </WrapItem>
                    <WrapItem>
                        <ExternalLinkButton
                            to="https://docs.google.com/spreadsheets/d/1XtQJPts8h59LNdIsShKRLMj4QndP97aC/copy"
                            leftIcon={<FAIcon iconStyle="b" icon="google-drive" />}
                        >
                            Copy Template
                        </ExternalLinkButton>
                    </WrapItem>
                </Wrap>
                {fileImporterEl}
                {openOptionsButton}
                <Box w="100%">
                    {!data ? (
                        <Spinner />
                    ) : (
                        <Select
                            aria-label="Select a file to preview imported data"
                            placeholder="Select a file"
                            variant="flushed"
                            value={selectedFileIndex}
                            onChange={(ev) => setSelectedFileIndex(ev.target.selectedIndex - 1)}
                        >
                            {data.map((data, idx) => (
                                <option key={data.fileName} value={idx}>
                                    {data.fileName}
                                </option>
                            ))}
                        </Select>
                    )}
                    <Box pt={2}>
                        {selectedData && (
                            <>
                                {"error" in selectedData ? (
                                    <Alert status="error">
                                        <AlertIcon />
                                        <AlertTitle mr={2}>Error parsing data!</AlertTitle>
                                        <AlertDescription>{selectedData.error}</AlertDescription>
                                    </Alert>
                                ) : (
                                    <Text
                                        as="pre"
                                        w="100%"
                                        overflowWrap="break-word"
                                        whiteSpace="pre-wrap"
                                        position="relative"
                                    >
                                        <Button
                                            aria-label="Copy output data"
                                            position="absolute"
                                            top={2}
                                            right={2}
                                            colorScheme="purple"
                                            onClick={() => {
                                                navigator.clipboard.writeText(JSON.stringify(selectedData, null, 2));
                                            }}
                                        >
                                            <FAIcon iconStyle="r" icon="clipboard" />
                                        </Button>
                                        <Code w="100%" p={2}>
                                            {JSON.stringify(selectedData.data, null, 2)}
                                        </Code>
                                    </Text>
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            </VStack>
            {optionsComponent}
        </>
    );
}

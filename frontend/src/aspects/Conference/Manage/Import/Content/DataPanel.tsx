import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Select, Spinner, Text, VStack } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import useCSVJSONXMLFileSelector from "../../../../Files/useCSVJSONXMLFileSelector";
import useCSVJSONXMLImportOptions from "../../../../Files/useCSVJSONXMLImportOptions";
import useCSVJSONXMLParse, { ParserResult } from "../../../../Files/useCSVJSONXMLParser";

function parser(data: any): ParserResult<{
    columns: string[];
    rows: any[][];
}> {
    // Researchr XML
    if (data.subevent) {
        data = data.subevent;
    }

    if (!(data instanceof Array)) {
        return {
            ok: false,
            error: "Data should be a list of items."
        };
    }
    // TODO
    return {
        ok: true,
        data: {
            columns: [], // TODO
            rows: data
        },
    };
}

export default function DataPanel(): JSX.Element {
    const { acceptedFiles, component: fileImporterEl } = useCSVJSONXMLFileSelector();
    const { importOptions, openOptionsButton, optionsComponent } = useCSVJSONXMLImportOptions(acceptedFiles);
    const { data } = useCSVJSONXMLParse(importOptions, parser);

    useEffect(() => {
        setSelectedFileIndex(0);
    }, [data]);
    const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);

    const selectedData =
        data && selectedFileIndex >= 0 && selectedFileIndex < data.length ? data[selectedFileIndex] : undefined;

    return (
        <>
            <VStack w="100%">
                {fileImporterEl}
                {openOptionsButton}
                <Box w="100%">
                    {!data ? (
                        <Spinner />
                    ) : (
                        <Select
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
                                    <Text as="p">{JSON.stringify(selectedData.data.rows, null, 2)}</Text>
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

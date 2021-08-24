import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    FormControl,
    FormHelperText,
    FormLabel,
    Select,
    Textarea,
} from "@chakra-ui/react";
import type {
    IntermediaryContentData,
    IntermediaryScheduleData,
} from "@clowdr-app/shared-types/build/import/intermediary";
import React, { useEffect, useState } from "react";
import type { ParsedData } from "../../../../Files/useCSVJSONXMLParser";

export default function ConfigPanel<T = IntermediaryContentData | IntermediaryScheduleData>({
    data,
    onChange,
    JSONataFunction,
    presetJSONataXMLQuery,
    presetJSONataJSONQuery,
    presetJSONataCSVQuery,
    presetJSONataUnknownFileTypeQuery,
}: {
    data: ParsedData<any[]>[];
    onChange?: (data: Record<string, T>) => void;
    JSONataFunction: (data: any, query: string) => T | string | undefined;
    presetJSONataXMLQuery?: string | ((name: string) => string);
    presetJSONataJSONQuery?: string | ((name: string) => string);
    presetJSONataCSVQuery?: string | ((name: string) => string);
    presetJSONataUnknownFileTypeQuery: string | ((name: string) => string);
}): JSX.Element {
    // * For each file, setup the JSONata queries to output exactly the types we need
    // * JSONata:
    //   http://docs.jsonata.org/overview   ---   https://try.jsonata.org/
    // * Create default mappings for HotCRP and Researchr
    // * Can the entire remapping be done as a giant JSONata query for now? Yes!

    const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);
    useEffect(() => {
        setSelectedFileIndex(-1);
    }, [data]);

    const [templates, setTemplates] = useState<Map<string, string>>(new Map());
    useEffect(() => {
        setTemplates((oldTemplates) => {
            const newTemplates = new Map(oldTemplates);
            for (const parsedData of data) {
                if (!newTemplates.has(parsedData.fileName)) {
                    if (presetJSONataXMLQuery && parsedData.fileName.toLowerCase().endsWith(".xml")) {
                        if (typeof presetJSONataXMLQuery === "string") {
                            newTemplates.set(parsedData.fileName, presetJSONataXMLQuery);
                        } else {
                            newTemplates.set(parsedData.fileName, presetJSONataXMLQuery(parsedData.fileName));
                        }
                    } else if (presetJSONataJSONQuery && parsedData.fileName.toLowerCase().endsWith(".json")) {
                        if (typeof presetJSONataJSONQuery === "string") {
                            newTemplates.set(parsedData.fileName, presetJSONataJSONQuery);
                        } else {
                            newTemplates.set(parsedData.fileName, presetJSONataJSONQuery(parsedData.fileName));
                        }
                    } else if (presetJSONataCSVQuery && parsedData.fileName.toLowerCase().endsWith(".csv")) {
                        if (typeof presetJSONataCSVQuery === "string") {
                            newTemplates.set(parsedData.fileName, presetJSONataCSVQuery);
                        } else {
                            newTemplates.set(parsedData.fileName, presetJSONataCSVQuery(parsedData.fileName));
                        }
                    } else {
                        if (typeof presetJSONataUnknownFileTypeQuery === "string") {
                            newTemplates.set(parsedData.fileName, presetJSONataUnknownFileTypeQuery);
                        } else {
                            newTemplates.set(
                                parsedData.fileName,
                                presetJSONataUnknownFileTypeQuery(parsedData.fileName)
                            );
                        }
                    }
                }
            }

            return newTemplates;
        });
    }, [data, presetJSONataCSVQuery, presetJSONataJSONQuery, presetJSONataUnknownFileTypeQuery, presetJSONataXMLQuery]);

    const [errors, setErrors] = useState<Map<string, string>>(new Map());
    useEffect(() => {
        const t = setTimeout(() => {
            const outputData: Record<string, T> = {};
            const outputErrors = new Map<string, string>();
            for (const parsedData of data) {
                if ("data" in parsedData) {
                    const template = templates.get(parsedData.fileName);
                    if (template) {
                        const result = JSONataFunction(parsedData.data, template);
                        if (typeof result === "string") {
                            outputErrors.set(parsedData.fileName, `Query resulted in invalid data. ${result}`);
                        } else if (result) {
                            outputData[parsedData.fileName] = result;
                        } else {
                            outputErrors.set(parsedData.fileName, "Query is invalid.");
                        }
                    } else {
                        outputErrors.set(parsedData.fileName, "No query found for this data.");
                    }
                } else {
                    outputErrors.set(parsedData.fileName, "Data was not imported properly.");
                }
            }
            setErrors(outputErrors);
            onChange?.(outputData);
        }, 500);
        return () => {
            clearTimeout(t);
        };
    }, [JSONataFunction, data, onChange, templates]);

    const selectedData =
        data && selectedFileIndex >= 0 && selectedFileIndex < data.length ? data[selectedFileIndex] : undefined;
    const selectedTemplate = selectedData ? templates.get(selectedData.fileName) : undefined;
    const selectedError = selectedData ? errors.get(selectedData.fileName) : undefined;

    return (
        <>
            {errors.size > 0 ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle mr={2}>
                        {errors.size} error{errors.size > 1 ? "s" : ""} processing data
                    </AlertTitle>
                    <AlertDescription>Please check each file below for errors.</AlertDescription>
                </Alert>
            ) : undefined}
            <Box>
                <Select
                    aria-label="Select a file to configure"
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
            </Box>
            {selectedError ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle mr={2}>An error occurred processing this file</AlertTitle>
                    <AlertDescription>{selectedError}</AlertDescription>
                </Alert>
            ) : undefined}
            {selectedData && (
                <Box>
                    <FormControl>
                        <FormLabel>Parser script (JSONata)</FormLabel>
                        <FormHelperText>
                            Provide a JSONata script to interpret your imported data into Midspace&apos;s intermediary
                            format. We currently provide template scripts for Researchr and HotCRP. (In future we hope
                            to make this a proper configuration editor and provide an easier-to-use system for
                            customising standard templates).
                        </FormHelperText>
                        <Textarea
                            transition="none"
                            fontFamily={
                                // eslint-disable-next-line quotes
                                'SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace'
                            }
                            minH="400px"
                            value={selectedTemplate ?? ""}
                            onChange={(ev) => {
                                setTemplates((oldTemplates) => {
                                    const newTemplates = new Map(oldTemplates);
                                    newTemplates.set(selectedData.fileName, ev.target.value);
                                    return newTemplates;
                                });
                            }}
                        />
                    </FormControl>
                </Box>
            )}
        </>
    );
}

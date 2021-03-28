import {
    Box,
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Input,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Switch,
    Text,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import assert from "assert";
import React, { useEffect, useState } from "react";
import type { FileInfo } from "./useCSVJSONXMLFileSelector";

export type ImportOptions = {
    file: File;
    encoding: string;
} & (
    | {
          type: "JSON";
      }
    | {
          type: "XML";
      }
    | {
          type: "CSV";
          delimiter: string;
          quoteChar: string;
          escapeChar: string;
          hasHeaders: boolean;
      }
);

function defaultImportOptions(fileInfo: FileInfo): ImportOptions {
    switch (fileInfo.type) {
        case "CSV":
            return {
                file: fileInfo.file,
                type: "CSV",
                delimiter: ",",
                // eslint-disable-next-line quotes
                escapeChar: '"',
                // eslint-disable-next-line quotes
                quoteChar: '"',
                hasHeaders: true,
                encoding: "utf-8",
            };
        case "JSON":
            return { file: fileInfo.file, type: "JSON", encoding: "utf-8" };
        case "XML":
            return { file: fileInfo.file, type: "XML", encoding: "utf-8" };
    }
}

function ImportOptionsPanel({
    options,
    setOptions,
}: {
    options: ImportOptions;
    setOptions: (newOptions: ImportOptions) => void;
}): JSX.Element {
    const defaultOpts = defaultImportOptions({
        ...options,
    });
    switch (options.type) {
        case "CSV":
            assert(defaultOpts.type === "CSV");
            return (
                <VStack spacing={4}>
                    <FormControl>
                        <FormLabel>Has headers?</FormLabel>
                        <HStack spacing={2}>
                            <Text as="span">No</Text>
                            <Switch
                                isChecked={options.hasHeaders}
                                onChange={(ev) => {
                                    setOptions({
                                        ...options,
                                        hasHeaders: ev.target.checked,
                                    });
                                }}
                                m={0}
                            />
                            <Text as="span">Yes</Text>
                        </HStack>
                        <FormHelperText>Whether your data has headers or not.</FormHelperText>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Delimiter</FormLabel>
                        <Input
                            min={1}
                            max={1}
                            value={options.delimiter}
                            onChange={(ev) => {
                                setOptions({
                                    ...options,
                                    delimiter:
                                        ev.target.value && ev.target.value.length
                                            ? ev.target.value[ev.target.value.length - 1]
                                            : defaultOpts.delimiter,
                                });
                            }}
                        />
                        <FormHelperText>The separator between columns in your data.</FormHelperText>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Escape Character</FormLabel>
                        <Input
                            min={1}
                            max={1}
                            value={options.escapeChar}
                            onChange={(ev) => {
                                setOptions({
                                    ...options,
                                    escapeChar:
                                        ev.target.value && ev.target.value.length
                                            ? ev.target.value[ev.target.value.length - 1]
                                            : defaultOpts.escapeChar,
                                });
                            }}
                        />
                        <FormHelperText>
                            The character that indicates the following character should be escaped.
                        </FormHelperText>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Quote Character</FormLabel>
                        <Input
                            min={1}
                            max={1}
                            value={options.quoteChar}
                            onChange={(ev) => {
                                setOptions({
                                    ...options,
                                    quoteChar:
                                        ev.target.value && ev.target.value.length
                                            ? ev.target.value[ev.target.value.length - 1]
                                            : defaultOpts.quoteChar,
                                });
                            }}
                        />
                        <FormHelperText>
                            The character that indicates the start and end of a string of text.
                        </FormHelperText>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Encoding</FormLabel>
                        <Input
                            value={options.encoding}
                            onChange={(ev) => {
                                setOptions({
                                    ...options,
                                    encoding:
                                        ev.target.value && ev.target.value.length
                                            ? ev.target.value
                                            : defaultOpts.encoding,
                                });
                            }}
                        />
                        <FormHelperText>
                            The text encoding of your file. See{" "}
                            <Link isExternal href="https://encoding.spec.whatwg.org/#names-and-labels">
                                this list of encodings
                            </Link>{" "}
                            for acceptable values.
                        </FormHelperText>
                    </FormControl>
                </VStack>
            );
        case "JSON":
            assert(defaultOpts.type === "JSON");
            return (
                <VStack spacing={4}>
                    <FormControl>
                        <FormLabel>Encoding</FormLabel>
                        <Input
                            value={options.encoding}
                            onChange={(ev) => {
                                setOptions({
                                    ...options,
                                    encoding:
                                        ev.target.value && ev.target.value.length
                                            ? ev.target.value
                                            : defaultOpts.encoding,
                                });
                            }}
                        />
                        <FormHelperText>
                            The text encoding of your file. See{" "}
                            <Link isExternal href="https://encoding.spec.whatwg.org/#names-and-labels">
                                this list of encodings
                            </Link>{" "}
                            for acceptable values.
                        </FormHelperText>
                    </FormControl>
                </VStack>
            );
        case "XML":
            assert(defaultOpts.type === "XML");
            return (
                <VStack spacing={4}>
                    <FormControl>
                        <FormLabel>Encoding</FormLabel>
                        <Input
                            value={options.encoding}
                            onChange={(ev) => {
                                setOptions({
                                    ...options,
                                    encoding:
                                        ev.target.value && ev.target.value.length
                                            ? ev.target.value
                                            : defaultOpts.encoding,
                                });
                            }}
                        />
                        <FormHelperText>
                            The text encoding of your file. See{" "}
                            <Link isExternal href="https://encoding.spec.whatwg.org/#names-and-labels">
                                this list of encodings
                            </Link>{" "}
                            for acceptable values.
                        </FormHelperText>
                    </FormControl>
                </VStack>
            );
    }
}

export default function useCSVJSONXMLImportOptions(
    fileInfos: FileInfo[]
): {
    importOptions: ImportOptions[];
    replaceImportOptions: (newOptions: ImportOptions[]) => void;
    openOptionsButton: JSX.Element;
    optionsComponent: JSX.Element;
} {
    const [importOptions, setImportOptions] = useState<ImportOptions[]>(fileInfos.map(defaultImportOptions));
    const [cachedOptions, setCachedOptions] = useState<ImportOptions[]>(importOptions);
    const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);

    useEffect(() => {
        setImportOptions(fileInfos.map(defaultImportOptions));
        setSelectedFileIndex(0);
    }, [fileInfos]);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const selectedOptions =
        selectedFileIndex >= 0 && selectedFileIndex < importOptions.length
            ? importOptions[selectedFileIndex]
            : undefined;

    useEffect(() => {
        if (!isOpen) {
            setCachedOptions(importOptions);
        }
    }, [importOptions, isOpen]);

    return {
        importOptions: cachedOptions,
        replaceImportOptions: setImportOptions,
        openOptionsButton: (
            <Button disabled={importOptions.length === 0} onClick={onOpen}>
                Importer options
            </Button>
        ),
        optionsComponent: (
            <>
                <Modal scrollBehavior="inside" isCentered isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Importer Options</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Select
                                placeholder="Select a file"
                                variant="flushed"
                                value={selectedFileIndex}
                                onChange={(ev) => setSelectedFileIndex(ev.target.selectedIndex - 1)}
                            >
                                {importOptions.map((options, idx) => (
                                    <option key={options.file.name} value={idx}>
                                        {options.file.name}
                                    </option>
                                ))}
                            </Select>
                            <Box pt={4}>{selectedOptions && <Text as="i">{selectedOptions.type}</Text>}</Box>
                            <Box pt={4}>
                                {selectedOptions && (
                                    <ImportOptionsPanel
                                        options={selectedOptions}
                                        setOptions={(opts) => {
                                            setImportOptions((oldOptions) => {
                                                const newOptions = [...oldOptions];
                                                newOptions[selectedFileIndex] = opts;
                                                return newOptions;
                                            });
                                        }}
                                    />
                                )}
                            </Box>
                        </ModalBody>

                        <ModalFooter>
                            <Button colorScheme="blue" mr={3} onClick={onClose}>
                                Done
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </>
        ),
    };
}

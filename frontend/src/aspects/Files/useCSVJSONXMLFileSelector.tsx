import {
    Box,
    Heading,
    HStack,
    Input,
    ListItem,
    Spinner,
    Text,
    UnorderedList,
    useColorModeValue,
} from "@chakra-ui/react";
import JSZip from "jszip";
import React, { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import FAIcon from "../Icons/FAIcon";

function normaliseFileType(name: string, type: string): "CSV" | "JSON" | "XML" | "ZIP" | false {
    name = name.toLowerCase();

    if (type.startsWith("application/zip") || name.endsWith(".zip")) {
        return "ZIP";
    }
    // Systems suck at knowing the raw type of data…
    else if (
        type.startsWith("application/vnd.ms-excel") ||
        type.startsWith("application/vnd.oasis.opendocument.spreadsheet") ||
        type.startsWith("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
        type.startsWith("application/vnd.collabio.xodocuments.spreadsheet")
    ) {
        if (name.endsWith(".csv")) {
            return "CSV";
        } else if (name.endsWith(".xml")) {
            return "XML";
        }
        return false;
    } else if (type === "application/json") {
        return "JSON";
    } else if (type === "text/xml") {
        return "XML";
    } else if (type === "text/csv") {
        return "CSV";
    } else if (type === "text/plain") {
        if (name.endsWith(".csv")) {
            return "CSV";
        } else if (name.endsWith(".json")) {
            return "JSON";
        } else if (name.endsWith(".xml")) {
            return "XML";
        } else {
            // Conservative guess at what the user might have tried to do
            return "CSV";
        }
    } else if (name.endsWith(".csv")) {
        return "CSV";
    } else if (name.endsWith(".json")) {
        return "JSON";
    } else if (name.endsWith(".xml")) {
        return "XML";
    }
    return false;
}

interface FileGroup {
    name: string;
    files: File[];
}

export interface FileInfo {
    file: File;
    type: "CSV" | "XML" | "JSON";
}

export default function useCSVJSONXMLFileSelector(): {
    acceptedFiles: FileInfo[];
    component: JSX.Element;
} {
    const { acceptedFiles: rawAcceptedFiles, fileRejections, getRootProps, getInputProps } = useDropzone({
        accept:
            ".csv, .txt, .json, .xml, .CSV, .TXT, .JSON, .XML, .zip, .ZIP, text/plain, text/csv, application/json, text/xml, application/zip",
        multiple: true,
    });

    const [acceptedFiles, setAcceptedFiles] = useState<(File | FileGroup)[] | null>([]);

    useEffect(() => {
        setAcceptedFiles(null);
    }, [rawAcceptedFiles]);

    useEffect(() => {
        if (!acceptedFiles) {
            (async () => {
                try {
                    const maybeManyFiles = await Promise.all(
                        rawAcceptedFiles.map(async (file) => {
                            const type = normaliseFileType(file.name, file.type);
                            if (type) {
                                if (type === "ZIP") {
                                    const zip = await JSZip.loadAsync(file);
                                    const keys = Object.keys(zip.files);
                                    const maybeResults = await Promise.all(
                                        keys.map(async (path) => {
                                            const file = zip.file(path);
                                            if (file && !file.dir) {
                                                const innerType = normaliseFileType(file.name, "<Unknown>");
                                                if (innerType) {
                                                    const dataArray = await file.async("arraybuffer");
                                                    return new File([dataArray], file.name, {
                                                        type: innerType,
                                                    });
                                                }
                                            }
                                            return null;
                                        })
                                    );
                                    return {
                                        name: file.name,
                                        files: maybeResults.reduce<File[]>(
                                            (acc, mFile) => (mFile ? [...acc, mFile] : acc),
                                            []
                                        ),
                                    } as FileGroup;
                                } else {
                                    return [file];
                                }
                            }
                            return null;
                        }, [] as File[])
                    );
                    setAcceptedFiles(
                        maybeManyFiles.reduce<(File | FileGroup)[]>(
                            (acc, f) => (f ? ("files" in f ? [...acc, f] : [...acc, ...f]) : acc),
                            []
                        )
                    );
                } catch {
                    setAcceptedFiles([]);
                }
            })();
        }
    }, [acceptedFiles, rawAcceptedFiles]);

    const acceptedFileItems =
        acceptedFiles === null ? (
            <Spinner />
        ) : acceptedFiles.length > 0 ? (
            <UnorderedList>
                {acceptedFiles.map((f) => {
                    if ("files" in f) {
                        return (
                            <ListItem key={f.name}>
                                <Text as="i">{f.name}</Text>
                                <UnorderedList>
                                    {f.files.map((f2) => {
                                        const type = normaliseFileType(f2.name, f2.type);
                                        return (
                                            <ListItem key={f2.name}>
                                                ({type}) {f2.name} - {f2.size.toLocaleString()} bytes
                                            </ListItem>
                                        );
                                    })}
                                </UnorderedList>
                            </ListItem>
                        );
                    } else {
                        const type = normaliseFileType(f.name, f.type);
                        return (
                            <ListItem key={f.name}>
                                ({type}) {f.name} - {f.size.toLocaleString()} bytes
                            </ListItem>
                        );
                    }
                })}
            </UnorderedList>
        ) : (
            <Text key="none">No files selected.</Text>
        );

    const fileRejectionItems = fileRejections.map(({ file, errors }) => (
        <ListItem key={file.name}>
            {file.name} - {file.size.toLocaleString()} bytes
            <UnorderedList spacing={2}>
                {errors.map((e) => (
                    <ListItem key={e.code}>
                        {e.code === "file-invalid-type"
                            ? "File type invalid. Must be a CSV, JSON or XML file."
                            : e.message}
                    </ListItem>
                ))}
            </UnorderedList>
        </ListItem>
    ));

    const borderColour = useColorModeValue("gray.800", "gray.200");
    const bgColour = useColorModeValue("gray.100", "gray.700");

    const inputProps = getInputProps();

    const outputAcceptedFiles = useMemo(
        () =>
            (
                acceptedFiles?.reduce<File[]>((acc, f) => ("files" in f ? [...acc, ...f.files] : [...acc, f]), []) ?? []
            ).map((file) => {
                const type = normaliseFileType(file.name, file.type);
                return {
                    file,
                    type,
                } as FileInfo;
            }),
        [acceptedFiles]
    );

    return {
        acceptedFiles: outputAcceptedFiles,
        component: (
            <Box maxW={600} borderWidth={2} borderStyle="dashed" borderColor={borderColour} borderRadius={5}>
                <Box
                    {...getRootProps({ className: "dropzone" })}
                    cursor={acceptedFiles === null ? "not-allowed" : "pointer"}
                    bg={bgColour}
                    p={5}
                >
                    <Input {...inputProps} size={inputProps.size?.toString()} isDisabled={acceptedFiles === null} />
                    <HStack>
                        <FAIcon iconStyle="s" icon="file-alt" fontSize="190%" />
                        <Box pl={2}>
                            <Text as="p">Drag and drop some files here, or click to select files</Text>
                            <Text as="em">
                                (Please select one or more CSV, JSON or XML files or ZIP files containing CSV/JSON/XML
                                files.)
                            </Text>
                        </Box>
                    </HStack>
                </Box>
                <Text as="aside" p={5}>
                    <Heading as="h4" fontSize="normal" textAlign="left" mb={2}>
                        Accepted files
                    </Heading>
                    {acceptedFileItems}
                    {fileRejectionItems.length > 0 ? (
                        <>
                            <Heading as="h4" fontSize="normal" textAlign="left" mt={5} mb={2}>
                                Rejected files
                            </Heading>
                            <UnorderedList>{fileRejectionItems}</UnorderedList>
                        </>
                    ) : undefined}
                </Text>
            </Box>
        ),
    };
}

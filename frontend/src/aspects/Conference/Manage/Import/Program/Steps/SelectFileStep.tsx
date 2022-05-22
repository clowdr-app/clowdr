import { Box, Link, List, ListItem, Spinner, Text, useColorModeValue, Wrap, WrapItem } from "@chakra-ui/react";
import type { RawRecord } from "@midspace/shared-types/import/program";
import React, { useEffect } from "react";
import FAIcon from "../../../../../Chakra/FAIcon";
import { DownloadButton, ExternalLinkButton } from "../../../../../Chakra/LinkButton";
import { Markdown } from "../../../../../Chakra/Markdown";
import useCSVJSONXMLFileSelector from "../../../../../Files/useCSVJSONXMLFileSelector";
import useCSVJSONXMLImportOptions from "../../../../../Files/useCSVJSONXMLImportOptions";
import type { ParsedData, ParserResult } from "../../../../../Files/useCSVJSONXMLParser";
import useCSVJSONXMLParse from "../../../../../Files/useCSVJSONXMLParser";
import Step from "./Step";

export default function SelectFileStep({
    onData,
    onNextStep,
    onCanProceedChange,
}: {
    onData?: (data: ParsedData<RawRecord[]>[] | undefined) => void;
    onNextStep?: () => void;
    onCanProceedChange?: (canProceed: boolean) => void;
}): JSX.Element {
    const { acceptedFiles, component: fileImporterEl } = useCSVJSONXMLFileSelector();
    const { importOptions, replaceImportOptions, openOptionsButton, optionsComponent } = useCSVJSONXMLImportOptions(
        acceptedFiles,
        true
    );
    const { data } = useCSVJSONXMLParse<RawRecord[]>(importOptions, parser);

    useEffect(() => {
        let newOptionsChanged = false;

        if (data) {
            const newOptions = importOptions.map((x) => ({ ...x }));
            for (const aData of data) {
                if ("error" in aData) {
                    // Excel saves CSVs as ANSI encoded by default,
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

    const anyErrors = data?.some((x) => "error" in x);
    const canProceed = !anyErrors && Boolean(data?.length);
    useEffect(() => {
        onCanProceedChange?.(canProceed);
    }, [onCanProceedChange, canProceed]);

    const red = useColorModeValue("red.600", "red.200");
    const green = useColorModeValue("green.500", "green.400");

    return (
        <Step
            onNextStep={onNextStep}
            isNextStepEnabled={canProceed}
            nextStepRequirement={
                anyErrors
                    ? "One or more files could not be read properly. Please resolve the error(s) to proceed."
                    : !data?.length
                    ? "Please select a file to proceed."
                    : undefined
            }
        >
            <Text>
                Get help{" "}
                <Link isExternal href="https://midspace.app/resources/organizer-guides/getting-started/import/">
                    importing your program
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
                    <List listStyleType="none">
                        {data.map((data, idx) => (
                            <ListItem key={data.fileName} value={idx} color={"error" in data ? red : undefined}>
                                {"error" in data ? (
                                    <FAIcon iconStyle="s" icon="exclamation-triangle" mr={2} />
                                ) : (
                                    <FAIcon iconStyle="s" icon="check-circle" mr={2} color={green} />
                                )}
                                <Link
                                    verticalAlign="middle"
                                    download={data.fileName.replace(/\.(csv|json|xml)$}/i, ".json")}
                                    href={window.URL.createObjectURL(
                                        new Blob([JSON.stringify(data)], { type: "application/json" })
                                    )}
                                    target="_blank"
                                >
                                    {data.fileName}
                                </Link>
                                {"error" in data ? (
                                    <Box ml={7} mt={1}>
                                        <Markdown>{data.error}</Markdown>
                                    </Box>
                                ) : undefined}
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
            {optionsComponent}
        </Step>
    );
}

function parser(data: any): ParserResult<RawRecord[]> {
    if (!(data instanceof Array)) {
        return {
            ok: false,
            error: "Data should be a list of items.",
        };
    }

    return {
        ok: true,
        data: data.map((x) => {
            const y: RawRecord = {} as RawRecord;
            for (const key in x) {
                x[key] = x[key].trim();
            }

            if ("Abstract" in x) {
                y.presentationAbstract = x["Abstract"];
            } else {
                y.presentationAbstract = "";
            }

            if ("Chair Email" in x && x["Chair Email"]?.length) {
                y.chairEmails = [x["Chair Email"]];
            } else if ("Chair Emails" in x) {
                y.chairEmails = x["Chair Emails"]
                    .trim()
                    .split(";")
                    .filter((x: string) => x.length)
                    .map((x: string) => x.trim().toLowerCase());
            } else {
                y.chairEmails = [];
            }

            if ("Chair Name" in x && x["Chair Name"]?.length) {
                y.chairNames = [x["Chair Name"]];
            } else if ("Chair Names" in x) {
                y.chairNames = x["Chair Names"]
                    .trim()
                    .split(";")
                    .filter((x: string) => x.length)
                    .map((x: string) => x.trim());
            } else {
                y.chairNames = [];
            }

            if ("Duration" in x) {
                y.presentationDuration = x["Duration"].length > 0 ? parseInt(x["Duration"], 10) : null;
            } else {
                y.presentationDuration = null;
            }

            if ("Editable abstract?" in x) {
                y.editableAbstract = x["Editable abstract?"].toLowerCase() === "yes";
            } else {
                y.editableAbstract = false;
            }

            if ("Image/poster upload?" in x) {
                y.imageOrPosterUpload = x["Image/poster upload?"].toLowerCase() === "request upload from speaker";
            } else {
                y.imageOrPosterUpload = false;
            }

            if ("Interaction Mode" in x) {
                if (x["Interaction Mode"].trim().length) {
                    y.interactionMode = x["Interaction Mode"].trim().toLowerCase();
                } else {
                    y.interactionMode = null;
                }
            } else {
                y.interactionMode = null;
            }

            if ("Other Authors" in x) {
                y.authors = x["Other Authors"]
                    .trim()
                    .split(";")
                    .map((x: string) => x.trim())
                    .filter((x: string) => x.length);
            } else {
                y.authors = [];
            }

            if ("Room Name for Session" in x) {
                if (x["Room Name for Session"].trim().length) {
                    y.sessionRoomName = x["Room Name for Session"].trim();
                }
            }

            if ("Session Abstract" in x) {
                if (x["Session Abstract"].trim().length) {
                    y.sessionAbstract = x["Session Abstract"].trim();
                }
            }

            if ("Session Duration" in x) {
                if (x["Session Duration"].trim().length) {
                    y.sessionDuration = parseInt(x["Session Duration"].trim(), 10);
                }
            }

            if ("Session Start" in x) {
                if (x["Session Start"].trim().length) {
                    y.sessionStart = x["Session Start"].trim();
                }
            }

            if ("Session Title" in x) {
                if (x["Session Title"].trim().length) {
                    y.sessionTitle = x["Session Title"].trim();
                }
            }

            if ("Slides upload?" in x) {
                y.slidesUpload = x["Slides upload?"].toLowerCase() === "request upload from speaker";
            } else {
                y.slidesUpload = false;
            }

            if ("Speaker Affiliations" in x) {
                y.speakerAffiliations = x["Speaker Affiliations"]
                    .trim()
                    .split(";")
                    .map((x: string) => x.trim())
                    .filter((x: string) => x.length);
            } else {
                y.speakerAffiliations = [];
            }

            if ("Speaker Emails" in x) {
                y.speakerEmails = x["Speaker Emails"]
                    .trim()
                    .split(";")
                    .map((x: string) => x.trim())
                    .filter((x: string) => x.length);
            } else {
                y.speakerEmails = [];
            }

            if ("Speaker Names" in x) {
                y.speakerNames = x["Speaker Names"]
                    .trim()
                    .split(";")
                    .map((x: string) => x.trim())
                    .filter((x: string) => x.length);
            } else {
                y.speakerNames = [];
            }

            if ("Tags" in x) {
                y.tags = x["Tags"]
                    .trim()
                    .split(";")
                    .map((x: string) => x.trim())
                    .filter((x: string) => x.length);
            } else {
                y.tags = [];
            }

            if ("Title" in x && x["Title"].trim().length) {
                y.presentationTitle = x["Title"].trim();
            } else {
                y.presentationTitle = null;
            }

            if ("Type" in x && x["Type"].trim().length) {
                y.presentationType = x["Type"].trim();
            } else {
                y.presentationType = null;
            }

            if ("Video upload?" in x) {
                y.videoUpload = x["Video upload?"].toLowerCase() === "request upload from speaker";
            } else {
                y.videoUpload = false;
            }

            if ("Website link?" in x) {
                y.websiteLinkUpload = x["Website link?"].toLowerCase() === "request upload from speaker";
            } else {
                y.websiteLinkUpload = false;
            }

            return y;
        }),
    };
}

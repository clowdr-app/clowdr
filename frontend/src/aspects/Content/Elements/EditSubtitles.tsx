import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    HStack,
    ListItem,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Spinner,
    Text,
    UnorderedList,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import type { SubtitleDetails } from "@midspace/shared-types/content";
import { gql } from "@urql/core";
import AmazonS3Uri from "amazon-s3-uri";
import * as R from "ramda";
import React, { Suspense, useCallback, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import type { SrtValidationError } from "srt-validator";
import srtValidator from "srt-validator";
import type { Validator } from "use-file-picker";
import { useFilePicker } from "use-file-picker";
import useFetch from "use-http";
import { useUpdateSubtitlesMutation } from "../../../generated/graphql";
import { DownloadButton } from "../../Chakra/LinkButton";
import { FAIcon } from "../../Icons/FAIcon";
import UnsavedChangesWarning from "../../LeavingPageWarnings/UnsavedChangesWarning";

gql`
    mutation UpdateSubtitles($elementId: String!, $magicToken: String!, $subtitleText: String!) {
        updateSubtitles(elementId: $elementId, magicToken: $magicToken, subtitleText: $subtitleText) {
            message
            success
        }
    }
`;

class ValidationError extends Error {
    constructor(message: string, public errors: SrtValidationError[]) {
        super(message);
        this.name = "ValidationError";
    }
}

const LazyTranscriptEditor = React.lazy(() => import("../../../TranscriptEditor"));

export default function EditSubtitles({
    videoS3URL,
    data,
    elementId,
    magicToken,
}: {
    videoS3URL: string;
    data: SubtitleDetails;
    elementId: string;
    magicToken: string;
}): JSX.Element {
    const [_updateSubtitlesResponse, updateSubtitles] = useUpdateSubtitlesMutation();
    const toast = useToast();
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const history = useHistory();

    const { bucket: _srtBucket, key: _srtKey } = AmazonS3Uri(data.s3Url);
    const { bucket: videoBucket, key: videoKey } = AmazonS3Uri(videoS3URL);
    assert.truthy(videoKey);
    const videoUrl = `https://${videoBucket}.s3-eu-west-1.amazonaws.com/${videoKey}`;
    const subtitlesUrl = `https://${_srtBucket}.s3.eu-west-1.amazonaws.com/${_srtKey}`;
    const { loading, error, data: subtitlesData = "" } = useFetch(subtitlesUrl, {}, []);

    const validator: Validator = {
        validateBeforeParsing: async (_config, _plainFiles) => {
            // do nothing
        },
        validateAfterParsing: async (_config, file, _reader) => {
            const text = await file.text();
            const errors = srtValidator(text);
            if (errors.length) {
                throw new ValidationError("Invalid SRT file", errors);
            }
        },
    };

    const [openFileSelector, { filesContent, clear, errors }] = useFilePicker({
        accept: ".srt",
        limitFilesConfig: { max: 1 },
        validators: [validator],
    });
    const [uploadingSrt, setUploadingSrt] = useState<boolean>(false);

    const validationErrors = useMemo(
        (): SrtValidationError[] =>
            R.flatten(
                errors
                    .filter((error) => error.name === "ValidationError")
                    .map((error) => (error as ValidationError).errors ?? [])
            ),
        [errors]
    );

    const saveSubtitles = useCallback(
        async (srtTranscript: string) => {
            try {
                const result = await updateSubtitles({
                    elementId,
                    magicToken,
                    subtitleText: srtTranscript,
                });
                if (result.data?.updateSubtitles?.success) {
                    toast({
                        description: "Saved subtitles",
                        status: "success",
                    });
                } else {
                    throw new Error(result.data?.updateSubtitles?.message ?? "Failed for unknown reason");
                }
                setHasUnsavedChanges(false);
            } catch (e: any) {
                console.error("Failed to save subtitles", e);
                toast({
                    title: "Failed to save subtitles",
                    description: (e as Error).message,
                    status: "error",
                });
            }
        },
        [elementId, magicToken, toast, updateSubtitles]
    );

    return (
        <React.Fragment>
            {loading ? <Spinner /> : undefined}
            {error || (!loading && !error && !subtitlesData) ? <Text>Could not load subtitles.</Text> : undefined}
            {subtitlesData ? (
                <React.Fragment>
                    <UnsavedChangesWarning hasUnsavedChanges={hasUnsavedChanges} />
                    <HStack wrap="wrap">
                        <Alert status="info" my={2} width={{ md: "100%", lg: "auto" }} minWidth="40ch" flex={4}>
                            <AlertIcon />
                            <Box flex="1">
                                <AlertTitle>Tips for editing your subtitles</AlertTitle>
                                <AlertDescription display="block">
                                    <Text>
                                        There are a few things to keep in mind while you are editing your subtitles.
                                    </Text>
                                    <UnorderedList>
                                        <ListItem>
                                            Due to a known issue, you should avoid adding or removing lines from the
                                            transcript. This will help to ensure that your subtitle timings remain
                                            correct.
                                        </ListItem>
                                        <ListItem>
                                            It&apos;s best to keep to 1 line per timecode, and a maximum line length of
                                            about 80 characters.
                                        </ListItem>
                                        <ListItem>Click the green save button to save your changes.</ListItem>
                                    </UnorderedList>
                                </AlertDescription>
                            </Box>
                        </Alert>
                        <VStack alignItems="stretch" flex={1} width="min-content" minWidth="30ch">
                            <DownloadButton to={subtitlesUrl} colorScheme="SecondaryActionButton" w="100%">
                                Download .SRT file
                            </DownloadButton>
                            {filesContent.length ? (
                                <HStack maxWidth="100%">
                                    <Box bgColor="gray.100" p={2} flex={1} overflow="hidden">
                                        <Text
                                            noOfLines={1}
                                            maxWidth="100%"
                                            minWidth={0}
                                            title={filesContent[0].name}
                                            aria-label={`Chosen file: ${filesContent[0].name}`}
                                        >
                                            {filesContent[0].name}
                                        </Text>
                                    </Box>
                                    <Button
                                        aria-label="Reset chosen .SRT file"
                                        title="Reset chosen .SRT file"
                                        color="DestructiveActionButton.400"
                                        onClick={clear}
                                    >
                                        <FAIcon iconStyle="s" icon="times" />
                                    </Button>
                                    <Button
                                        aria-label="Finish uploading chosen .SRT file"
                                        title="Finish uploading chosen .SRT file"
                                        colorScheme="ConfirmButton"
                                        isLoading={uploadingSrt}
                                        onClick={async () => {
                                            try {
                                                setUploadingSrt(true);
                                                await saveSubtitles(filesContent[0].content);
                                                clear();
                                                history.go(0);
                                            } catch (err: any) {
                                                console.error("Failed to save subtitles", err);
                                                toast({
                                                    status: "error",
                                                    title: "Failed to save uploaded subtitles",
                                                    description: (err as Error).message,
                                                });
                                            } finally {
                                                setUploadingSrt(false);
                                            }
                                        }}
                                    >
                                        <FAIcon iconStyle="s" icon="file-upload" />
                                    </Button>
                                </HStack>
                            ) : (
                                <HStack>
                                    <Button
                                        colorScheme="PrimaryActionButton"
                                        leftIcon={<FAIcon iconStyle="s" icon="file-upload" />}
                                        onClick={openFileSelector}
                                        flex={1}
                                    >
                                        Upload .SRT file
                                    </Button>
                                    {errors.length ? (
                                        <Popover>
                                            <PopoverTrigger>
                                                <Button
                                                    title="Problems found with .SRT file"
                                                    color="red.400"
                                                    aria-label="Problems found with .SRT file"
                                                >
                                                    <FAIcon iconStyle="s" icon="exclamation-circle" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <PopoverArrow />
                                                <PopoverCloseButton />
                                                <PopoverHeader>Errors found in .SRT file</PopoverHeader>
                                                <PopoverBody>
                                                    <Button
                                                        my={1}
                                                        size="sm"
                                                        color="DestructiveActionButton.400"
                                                        onClick={clear}
                                                        leftIcon={<FAIcon iconStyle="s" icon="times" />}
                                                    >
                                                        Reset chosen file
                                                    </Button>
                                                    <UnorderedList>
                                                        {validationErrors.map((problem, idx) => (
                                                            <ListItem key={idx}>
                                                                <Text>
                                                                    Error ({problem.errorCode}) on line{" "}
                                                                    {problem.lineNumber}: {problem.message}
                                                                </Text>
                                                            </ListItem>
                                                        ))}
                                                    </UnorderedList>
                                                </PopoverBody>
                                            </PopoverContent>
                                        </Popover>
                                    ) : undefined}
                                </HStack>
                            )}
                        </VStack>
                    </HStack>
                    <Suspense fallback={<Spinner />}>
                        <LazyTranscriptEditor
                            srtTranscript={subtitlesData}
                            mediaUrl={videoUrl}
                            handleSaveEditor={saveSubtitles}
                            handleChange={() => setHasUnsavedChanges(true)}
                        />
                    </Suspense>
                </React.Fragment>
            ) : undefined}
        </React.Fragment>
    );
}

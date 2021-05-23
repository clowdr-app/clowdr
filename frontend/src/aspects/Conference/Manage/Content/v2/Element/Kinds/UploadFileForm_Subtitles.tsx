import {
    Button,
    FormControl,
    FormHelperText,
    Heading,
    List,
    ListItem,
    Text,
    UnorderedList,
    useToast,
} from "@chakra-ui/react";
import {
    AWSJobStatus,
    ElementBaseType,
    VideoBroadcastBlob,
    VideoCountdownBlob,
    VideoFileBlob,
    VideoFillerBlob,
    VideoPrepublishBlob,
    VideoSponsorsFillerBlob,
    VideoTitlesBlob,
} from "@clowdr-app/shared-types/build/content";
import AwsS3Multipart from "@uppy/aws-s3-multipart";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";
import { DragDrop, StatusBar } from "@uppy/react";
import "@uppy/status-bar/dist/style.css";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import { Form, Formik } from "formik";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import srtValidator, { SrtValidationError } from "srt-validator";
import FAIcon from "../../../../../../Icons/FAIcon";
import UnsavedChangesWarning from "../../../../../../LeavingPageWarnings/UnsavedChangesWarning";
import type { ElementDescriptor } from "./Types";

export default function UploadFileForm_Subtitles({
    item,
    onElementChange,
    contentBaseType,
}: {
    item: ElementDescriptor;
    onElementChange?: (newItem: ElementDescriptor) => void;
    contentBaseType: ElementBaseType.Video;
}): JSX.Element {
    const toast = useToast();
    const [files, setFiles] = useState<Uppy.UppyFile[]>([]);

    const [srtProblems, setSrtProblems] = useState<SrtValidationError[]>([]);
    useEffect(() => {
        async function fn(): Promise<void> {
            if (files.length === 0) {
                setSrtProblems([]);
                return;
            }

            const srtString = await files[0].data.text();
            const errors = srtValidator(srtString);
            setSrtProblems(errors);
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files]);

    const uppy = useMemo(() => {
        const uppy = Uppy<Uppy.StrictTypes>({
            id: "subtitles-upload",
            meta: {
                elementId: item.id,
            },
            allowMultipleUploads: false,
            restrictions: {
                allowedFileTypes: [".srt"],
                maxNumberOfFiles: 1,
                minNumberOfFiles: 1,
            },
            autoProceed: false,
        });

        uppy?.use(AwsS3Multipart, {
            limit: 4,
            companionUrl: import.meta.env.SNOWPACK_PUBLIC_COMPANION_BASE_URL,
        });
        return uppy;
    }, [item.id]);

    const updateFiles = useCallback(() => {
        const validNameRegex = /^[a-zA-Z0-9.!*'()\-_ ]+$/;
        if (uppy) {
            const invalidFiles = uppy?.getFiles().filter((file) => !validNameRegex.test(file.name));
            for (const invalidFile of invalidFiles) {
                toast({
                    status: "error",
                    description:
                        "Invalid file name. File names must only contain letters, numbers, spaces and the following special characters: !*'()-_",
                });
                uppy.removeFile(invalidFile.id);
            }

            setFiles(uppy.getFiles());
        }
    }, [toast, uppy]);

    useEffect(() => {
        uppy?.on("file-added", updateFiles);
        uppy?.on("file-removed", updateFiles);
        uppy?.on("upload-success", () => {
            toast({
                status: "success",
                description: "All files uploaded.",
            });
        });
    }, [toast, updateFiles, uppy]);

    const latestVersionData = useMemo<
        | VideoFileBlob
        | VideoBroadcastBlob
        | VideoPrepublishBlob
        | VideoCountdownBlob
        | VideoFillerBlob
        | VideoSponsorsFillerBlob
        | VideoTitlesBlob
        | null
    >(() => {
        const latest = R.last(item.data);
        if (!latest || latest.data.baseType !== ElementBaseType.Video) {
            return null;
        }
        // Make sure subtitles are already generated so uploaded ones don't get overwritten later
        if (
            !latest.data.subtitles["en_US"] ||
            !latest.data.subtitles["en_US"]?.s3Url?.length ||
            latest.data.subtitles["en_US"].status !== AWSJobStatus.Completed
        ) {
            return null;
        }
        return latest.data;
    }, [item.data]);

    return latestVersionData ? (
        <>
            <Formik
                initialValues={{}}
                onSubmit={async (_values) => {
                    if (!uppy) {
                        throw new Error("No Uppy instance");
                    }
                    let result;
                    try {
                        result = await uppy.upload();
                    } catch (e) {
                        console.error("Failed to upload subtitles", e);
                        toast({
                            status: "error",
                            description: "Failed to upload subtitles. Please try again.",
                        });
                        uppy.reset();
                        return;
                    }

                    if (result.failed.length > 0 || result.successful.length < 1) {
                        console.error("Failed to upload subtitles", result.failed);
                        toast({
                            status: "error",
                            description: "Failed to upload subtitles. Please try again later.",
                        });
                        uppy.reset();
                        return;
                    }

                    try {
                        const { bucket, key } = new AmazonS3URI(result.successful[0].uploadURL);
                        assert(bucket);
                        assert(key);

                        toast({
                            status: "success",
                            description: "Uploaded subtitles successfully.",
                        });
                        uppy.reset();

                        if (onElementChange) {
                            if (contentBaseType !== ElementBaseType.Video) {
                                throw new Error(`Content has wrong base type ${contentBaseType}`);
                            }

                            if (!latestVersionData) {
                                throw new Error("Content does not have a valid existing version");
                            }
                            onElementChange({
                                ...item,
                                data: [
                                    ...item.data,
                                    {
                                        createdAt: Date.now(),
                                        createdBy: "user",
                                        data: {
                                            ...latestVersionData,
                                            subtitles: {
                                                en_US: {
                                                    s3Url: `s3://${bucket}/${key}`,
                                                    status: AWSJobStatus.Completed,
                                                },
                                            },
                                        },
                                    },
                                ],
                            });
                        }
                    } catch (e) {
                        console.error("Failed to submit item", e);
                        toast({
                            status: "error",
                            title: "Failed to submit item.",
                            description: e?.message ?? "Please try again later.",
                        });
                        uppy.reset();
                        return;
                    }
                }}
            >
                {({ dirty, isSubmitting, isValid }) => (
                    <>
                        <Heading as="h3" fontSize="lg" mb={4}>
                            Upload new subtitles
                        </Heading>
                        <UnsavedChangesWarning hasUnsavedChanges={dirty} />
                        <Form style={{ width: "100%" }}>
                            <FormControl isInvalid={!files} isRequired>
                                <DragDrop uppy={uppy as Uppy.Uppy} allowMultipleFiles={false} />
                                <FormHelperText>Subtitles must be in SRT format.</FormHelperText>
                            </FormControl>
                            <UnorderedList mb={2}>
                                {files.map((file) => (
                                    <ListItem key={file.id}>
                                        {file.name}{" "}
                                        <Button onClick={() => uppy?.removeFile(file.id)}>
                                            <FAIcon iconStyle="s" icon="times" color="red.400" />
                                        </Button>
                                    </ListItem>
                                ))}
                            </UnorderedList>
                            <List mb={2}>
                                {srtProblems.map((problem, idx) => (
                                    <ListItem key={idx}>
                                        <Text>
                                            Error ({problem.errorCode}) on line {problem.lineNumber}: {problem.message}
                                        </Text>
                                    </ListItem>
                                ))}
                            </List>
                            <StatusBar uppy={uppy as Uppy.Uppy} hideAfterFinish hideUploadButton />
                            <Button
                                mt={2}
                                colorScheme="purple"
                                isLoading={isSubmitting}
                                type="submit"
                                isDisabled={!isValid || files.length !== 1 || srtProblems.length > 0}
                            >
                                Upload
                            </Button>
                        </Form>
                    </>
                )}
            </Formik>
        </>
    ) : (
        <></>
    );
}

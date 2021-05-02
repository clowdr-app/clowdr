import { Button, FormControl, FormHelperText, ListItem, UnorderedList, useToast } from "@chakra-ui/react";
import { ElementBaseType } from "@clowdr-app/shared-types/build/content";
import AwsS3Multipart from "@uppy/aws-s3-multipart";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";
import { DragDrop, StatusBar } from "@uppy/react";
import "@uppy/status-bar/dist/style.css";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import { Form, Formik } from "formik";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FAIcon from "../../../Icons/FAIcon";
import UnsavedChangesWarning from "../../../LeavingPageWarnings/UnsavedChangesWarning";
import type { ElementDescriptor } from "./Types";

export default function UploadFileForm_Element({
    item,
    allowedFileTypes,
    onItemChange,
    contentBaseType,
}: {
    item: ElementDescriptor;
    allowedFileTypes: string[];
    onItemChange?: (newItem: ElementDescriptor) => void;
    contentBaseType: ElementBaseType.File | ElementBaseType.Video;
}): JSX.Element {
    const toast = useToast();
    const [files, setFiles] = useState<Uppy.UppyFile[]>([]);
    const uppy = useMemo(() => {
        const uppy = Uppy<Uppy.StrictTypes>({
            id: "content-item-upload",
            meta: {
                elementId: item.id,
            },
            allowMultipleUploads: false,
            restrictions: {
                allowedFileTypes,
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
    }, [allowedFileTypes, item.id]);

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

    return (
        <>
            <Formik
                initialValues={{
                    agree: false,
                }}
                onSubmit={async (_values) => {
                    if (!uppy) {
                        throw new Error("No Uppy instance");
                    }
                    let result;
                    try {
                        result = await uppy.upload();
                    } catch (e) {
                        console.error("Failed to upload file", e);
                        toast({
                            status: "error",
                            description: "Failed to upload file. Please try again.",
                        });
                        uppy.reset();
                        return;
                    }

                    if (result.failed.length > 0 || result.successful.length < 1) {
                        console.error("Failed to upload file", result.failed);
                        toast({
                            status: "error",
                            description: "Failed to upload file. Please try again later.",
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
                            description: "Uploaded item successfully.",
                        });
                        uppy.reset();

                        if (onItemChange) {
                            if (contentBaseType === ElementBaseType.Video) {
                                onItemChange({
                                    ...item,
                                    data: [
                                        ...item.data,
                                        {
                                            createdAt: Date.now(),
                                            createdBy: "user",
                                            data: {
                                                baseType: ElementBaseType.Video,
                                                s3Url: `s3://${bucket}/${key}`,
                                                type: item.typeName as any,
                                                subtitles: {},
                                            },
                                        },
                                    ],
                                });
                            } else if (contentBaseType === ElementBaseType.File) {
                                onItemChange({
                                    ...item,
                                    data: [
                                        ...item.data,
                                        {
                                            createdAt: Date.now(),
                                            createdBy: "user",
                                            data: {
                                                baseType: ElementBaseType.File,
                                                s3Url: `s3://${bucket}/${key}`,
                                                type: item.typeName as any,
                                            },
                                        },
                                    ],
                                });
                            }
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
                        <UnsavedChangesWarning hasUnsavedChanges={dirty} />
                        <Form style={{ width: "100%" }}>
                            <FormControl isInvalid={!files} isRequired>
                                <DragDrop uppy={uppy as Uppy.Uppy} allowMultipleFiles={false} />
                                <FormHelperText>File types: {allowedFileTypes.join(", ")}</FormHelperText>
                            </FormControl>
                            <UnorderedList mb={4}>
                                {files.map((file) => (
                                    <ListItem key={file.id}>
                                        {file.name}{" "}
                                        <Button onClick={() => uppy?.removeFile(file.id)}>
                                            <FAIcon iconStyle="s" icon="times" color="red.400" />
                                        </Button>
                                    </ListItem>
                                ))}
                            </UnorderedList>
                            <StatusBar uppy={uppy as Uppy.Uppy} hideAfterFinish hideUploadButton />
                            <Button
                                colorScheme="green"
                                isLoading={isSubmitting}
                                type="submit"
                                isDisabled={!isValid || files.length !== 1}
                            >
                                Upload
                            </Button>
                        </Form>
                    </>
                )}
            </Formik>
        </>
    );
}

import {
    Button,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Input,
    ListItem,
    Spinner,
    UnorderedList,
    useToast,
} from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import { ElementBaseType } from "@midspace/shared-types/content";
import AwsS3Multipart from "@uppy/aws-s3-multipart";
import type { UppyFile } from "@uppy/core";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";
import "@uppy/status-bar/dist/style.css";
import AmazonS3URI from "amazon-s3-uri";
import type { FieldProps } from "formik";
import { Field, Form, Formik } from "formik";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import FAIcon from "../../../../../../Icons/FAIcon";
import UnsavedChangesWarning from "../../../../../../LeavingPageWarnings/UnsavedChangesWarning";
import type { ElementDescriptor } from "./Types";

const DragDrop = React.lazy(() => import("@uppy/react").then((x) => ({ default: x.DragDrop })));
const StatusBar = React.lazy(() => import("@uppy/react").then((x) => ({ default: x.StatusBar })));

export default function UploadFileForm_Element({
    item,
    allowedFileTypes,
    onElementChange,
    contentBaseType,
}: {
    item: ElementDescriptor;
    allowedFileTypes: string[];
    onElementChange?: (newItem: ElementDescriptor) => void;
    contentBaseType: ElementBaseType.File | ElementBaseType.Video | ElementBaseType.Audio;
}): JSX.Element {
    const toast = useToast();
    const [files, setFiles] = useState<UppyFile[]>([]);
    const uppy = useMemo(() => {
        const uppy = new Uppy({
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

        uppy.use(AwsS3Multipart, {
            limit: 4,
            companionUrl:
                typeof import.meta.env.VITE_COMPANION_BASE_URL === "string"
                    ? import.meta.env.VITE_COMPANION_BASE_URL
                    : "",
        });
        return uppy;
    }, [allowedFileTypes, item.id]);

    useEffect(() => {
        const onUpdateFiles = () => {
            const validNameRegex = /^[a-zA-Z0-9.!*'()\-_ ]+$/;
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
        };
        uppy.on("file-added", onUpdateFiles);
        uppy.on("file-removed", onUpdateFiles);

        const onError = (err: Error) => {
            console.error("Error while uploading file", { err });
            toast({
                status: "error",
                title: "Error while uploading file",
                description: `${err.name}: ${err.message}`,
            });
        };
        uppy.on("error", onError);

        const onUploadError = (_file: unknown, err: Error) => {
            console.error("Error while uploading file", { err });
            toast({
                status: "error",
                title: "Error while uploading file",
                description: `${err.name}: ${err.message}`,
            });
        };
        uppy.on("upload-error", onUploadError);

        return () => {
            uppy.off("file-added", onUpdateFiles);
            uppy.off("file-removed", onUpdateFiles);
            uppy.off("error", onError);
            uppy.off("upload-error", onUploadError);
        };
    }, [toast, uppy]);

    const latestVersion = useMemo(() => (item.data?.length ? item.data[item.data.length - 1] : undefined), [item.data]);

    return (
        <Suspense fallback={<Spinner />}>
            <Formik
                initialValues={{
                    agree: false,
                    altText: latestVersion?.data.baseType === ElementBaseType.File ? latestVersion.data.altText : "",
                }}
                onSubmit={async (values) => {
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
                        assert.truthy(bucket);
                        assert.truthy(key);

                        toast({
                            status: "success",
                            description: "Uploaded item successfully.",
                        });
                        uppy.reset();

                        if (onElementChange) {
                            if (contentBaseType === ElementBaseType.Video) {
                                onElementChange({
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
                            }
                            if (contentBaseType === ElementBaseType.Audio) {
                                onElementChange({
                                    ...item,
                                    data: [
                                        ...item.data,
                                        {
                                            createdAt: Date.now(),
                                            createdBy: "user",
                                            data: {
                                                baseType: ElementBaseType.Audio,
                                                s3Url: `s3://${bucket}/${key}`,
                                                type: item.typeName as any,
                                                subtitles: {},
                                            },
                                        },
                                    ],
                                });
                            } else if (contentBaseType === ElementBaseType.File) {
                                onElementChange({
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
                                                altText: values.altText?.length ? values.altText : undefined,
                                            },
                                        },
                                    ],
                                });
                            }
                        }
                    } catch (e: any) {
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
                                <DragDrop uppy={uppy} allowMultipleFiles={false} />
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
                            <StatusBar uppy={uppy} hideAfterFinish hideUploadButton />
                            {contentBaseType === ElementBaseType.File ? (
                                <Field
                                    name="altText"
                                    validate={(inValue: string | null | undefined) => {
                                        let error;
                                        if (!inValue?.length) {
                                            error = "Please provide alternative text.";
                                        }
                                        return error;
                                    }}
                                >
                                    {({ form, field }: FieldProps<string>) => (
                                        <FormControl
                                            mb={2}
                                            isInvalid={!!form.errors.altText && !!form.touched.altText}
                                            isRequired
                                            mt={5}
                                        >
                                            <FormLabel>Alternative text (for accessibility)</FormLabel>
                                            <Input type="text" {...field} />
                                            <FormErrorMessage>{form.errors.altText}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                            ) : undefined}
                            <Button
                                colorScheme="purple"
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
        </Suspense>
    );
}

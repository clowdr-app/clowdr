import {
    Button,
    Checkbox,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    ListItem,
    Text,
    UnorderedList,
    useToast,
} from "@chakra-ui/react";
import AwsS3Multipart from "@uppy/aws-s3-multipart";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.css";
import "@uppy/drag-drop/dist/style.css";
import { DragDrop, StatusBar } from "@uppy/react";
import "@uppy/status-bar/dist/style.css";
import { Field, FieldProps, Form, Formik } from "formik";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSubmitUploadableElementMutation } from "../../generated/graphql";
import FAIcon from "../Icons/FAIcon";
import UnsavedChangesWarning from "../LeavingPageWarnings/UnsavedChangesWarning";

export default function UploadFileForm({
    elementId,
    magicToken,
    allowedFileTypes,
    uploadAgreement,
    handleFormSubmitted,
}: {
    elementId: string;
    magicToken: string;
    allowedFileTypes: string[];
    uploadAgreement?: string;
    handleFormSubmitted?: () => Promise<void>;
}): JSX.Element {
    const toast = useToast();
    const [files, setFiles] = useState<Uppy.UppyFile[]>([]);
    const [submitUploadableElement] = useSubmitUploadableElementMutation();
    const uppy = useMemo(() => {
        const uppy = Uppy<Uppy.StrictTypes>({
            id: "required-content-item-upload",
            meta: {
                uploadableId: elementId,
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
    }, [allowedFileTypes, elementId]);

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
                        const submitResult = await submitUploadableElement({
                            variables: {
                                elementData: {
                                    s3Url: result.successful[0].uploadURL,
                                },
                                magicToken,
                            },
                        });

                        if (submitResult.errors || !submitResult.data?.submitUploadableElement?.success) {
                            throw new Error(
                                submitResult.data?.submitUploadableElement?.message ??
                                    submitResult.errors?.join("; " ?? "Unknown reason for failure.")
                            );
                        }

                        toast({
                            status: "success",
                            description: "Uploaded item successfully.",
                        });
                        uppy.reset();

                        if (handleFormSubmitted) {
                            await handleFormSubmitted();
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
                {({ dirty, ...props }) => (
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
                            {uploadAgreement && (
                                <Field
                                    name="agree"
                                    validate={(inValue: string | null | undefined) => {
                                        let error;
                                        if (!inValue) {
                                            error = "Must agree to terms";
                                        }
                                        return error;
                                    }}
                                >
                                    {({ form, field }: FieldProps<string>) => (
                                        <FormControl
                                            isInvalid={!!form.errors.agree && !!form.touched.agree}
                                            isRequired
                                            mb={4}
                                        >
                                            <FormLabel htmlFor="agree">Upload agreement</FormLabel>
                                            <Text mb={4}>{uploadAgreement}</Text>
                                            <Checkbox {...field} id="agree" />
                                            <FormHelperText>I agree to the upload conditions.</FormHelperText>
                                            <FormErrorMessage>{form.errors.agree}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                            )}
                            <StatusBar uppy={uppy as Uppy.Uppy} hideAfterFinish hideUploadButton />
                            <Button
                                colorScheme="purple"
                                isLoading={props.isSubmitting}
                                type="submit"
                                isDisabled={!props.isValid || files.length !== 1}
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

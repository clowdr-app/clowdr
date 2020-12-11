import {
    Button,
    Checkbox,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Heading,
    Spinner,
    useToast,
} from "@chakra-ui/react";
import AwsS3Multipart from "@uppy/aws-s3-multipart";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.css";
import "@uppy/progress-bar/dist/style.css";
import { DragDrop, ProgressBar } from "@uppy/react";
import { Field, FieldProps, Form, Formik } from "formik";
import gql from "graphql-tag";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    useSelectRequiredItemQuery,
    useSubmitContentItemMutation,
} from "../../generated/graphql";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import FAIcon from "../Icons/FAIcon";
import UnsavedChangesWarning from "../LeavingPageWarnings/UnsavedChangesWarning";
import UploadedContentItem from "./UploadedContentItem";

gql`
    query SelectRequiredItem {
        RequiredContentItem {
            id
            contentTypeName
            name
            conference {
                id
                name
            }
        }
    }

    mutation SubmitContentItem($contentItemData: jsonb!, $magicToken: String!) {
        submitContentItem(data: $contentItemData, magicToken: $magicToken) {
            message
            success
        }
    }
`;

export default function UploadItemPage({
    token,
}: {
    token: string;
}): JSX.Element {
    const { loading, error, data } = useSelectRequiredItemQuery({
        fetchPolicy: "network-only",
        context: {
            headers: {
                "x-hasura-magic-token": token,
            },
        },
    });
    useQueryErrorToast(error);
    const toast = useToast();
    const [files, setFiles] = useState<Uppy.UppyFile[]>([]);
    const [submitContentItem] = useSubmitContentItemMutation();

    const uppy = useMemo(() => {
        if (!data?.RequiredContentItem[0]) {
            return null;
        }
        const uppy = Uppy<Uppy.StrictTypes>({
            id: "required-content-item-upload",
            meta: {
                requiredContentItemId: data.RequiredContentItem[0].id,
            },
            allowMultipleUploads: false,
            restrictions: {
                allowedFileTypes: [".mp4", ".mkv", ".webm"],
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
    }, [data?.RequiredContentItem]);

    const updateFiles = useCallback(() => {
        const validNameRegex = /^[a-zA-Z0-9.!*'()\-_ ]+$/;
        if (uppy) {
            const invalidFiles = uppy
                ?.getFiles()
                .filter((file) => !validNameRegex.test(file.name));
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
    });

    return (
        <>
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Upload item
            </Heading>
            {loading ? (
                <Spinner />
            ) : error ? (
                <>An error occurred while loading data.</>
            ) : (
                <>
                    <Heading as="h2" fontSize="1.5rem">
                        {data?.RequiredContentItem[0].name}
                    </Heading>
                    <ProgressBar
                        uppy={uppy as Uppy.Uppy}
                        fixed
                        hideAfterFinish
                    />
                    <Formik
                        initialValues={{
                            agree: false,
                        }}
                        onSubmit={async (values) => {
                            console.log(values);
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
                                    description:
                                        "Failed to upload file. Please try again.",
                                });
                                uppy.reset();
                                return;
                            }

                            if (
                                result.failed.length > 0 ||
                                result.successful.length < 1
                            ) {
                                console.error(
                                    "Failed to upload file",
                                    result.failed
                                );
                                toast({
                                    status: "error",
                                    description:
                                        "Failed to upload file. Please try again later.",
                                });
                                uppy.reset();
                                return;
                            }

                            try {
                                const submitResult = await submitContentItem({
                                    variables: {
                                        contentItemData: {
                                            s3Url:
                                                result.successful[0].uploadURL,
                                        },
                                        magicToken: token,
                                    },
                                });

                                if (
                                    submitResult.errors ||
                                    !submitResult.data?.submitContentItem
                                        ?.success
                                ) {
                                    console.error(
                                        "Failed to submit item",
                                        submitResult.errors,
                                        submitResult.data?.submitContentItem
                                            ?.message
                                    );
                                    toast({
                                        status: "error",
                                        description: `Failed to submit item. Please try again later. Error: ${[
                                            submitResult.data?.submitContentItem
                                                ?.message,
                                            ...(submitResult.errors?.map(
                                                (e) => e.message
                                            ) ?? []),
                                        ].join("; ")}`,
                                    });
                                    uppy.reset();
                                    return;
                                }

                                toast({
                                    status: "success",
                                    description: "Submitted item successfully.",
                                });
                                uppy.reset();
                                // history.push("/");
                            } catch (e) {
                                console.error("Failed to submit item", e);
                                toast({
                                    status: "error",
                                    description:
                                        "Failed to submit item. Please try again later.",
                                });
                                uppy.reset();
                                return;
                            }
                        }}
                    >
                        {({ dirty, ...props }) => (
                            <>
                                <UnsavedChangesWarning
                                    hasUnsavedChanges={dirty}
                                />
                                <Form>
                                    <DragDrop
                                        uppy={uppy as Uppy.Uppy}
                                        allowMultipleFiles={false}
                                    />
                                    <ul>
                                        {files.map((file) => (
                                            <li key={file.id}>
                                                {file.name}{" "}
                                                <Button
                                                    onClick={() =>
                                                        uppy?.removeFile(
                                                            file.id
                                                        )
                                                    }
                                                >
                                                    <FAIcon
                                                        iconStyle="s"
                                                        icon="times"
                                                        color="red.400"
                                                    />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                    <Field
                                        name="agree"
                                        validate={(
                                            inValue: string | null | undefined
                                        ) => {
                                            let error;
                                            if (!inValue) {
                                                error = "Must agree to terms";
                                            }
                                            return error;
                                        }}
                                    >
                                        {({
                                            form,
                                            field,
                                        }: FieldProps<string>) => (
                                            <FormControl
                                                isInvalid={
                                                    !!form.errors.agree &&
                                                    !!form.touched.agree
                                                }
                                                isRequired
                                            >
                                                <FormLabel htmlFor="agree">
                                                    Agree?
                                                </FormLabel>
                                                <Checkbox
                                                    {...field}
                                                    id="agree"
                                                />
                                                <FormHelperText>
                                                    Whether you agree to the
                                                    upload conditions.
                                                </FormHelperText>
                                                <FormErrorMessage>
                                                    {form.errors.agree}
                                                </FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Button
                                        mt={4}
                                        colorScheme="green"
                                        isLoading={props.isSubmitting}
                                        type="submit"
                                        isDisabled={!props.isValid || !dirty}
                                    >
                                        Upload
                                    </Button>
                                </Form>
                            </>
                        )}
                    </Formik>
                </>
            )}
            <UploadedContentItem magicToken={token} />
        </>
    );
}

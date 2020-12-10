import {
    Button,
    Checkbox,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Heading,
    Spinner,
} from "@chakra-ui/react";
import AwsS3Multipart from "@uppy/aws-s3-multipart";
import Uppy from "@uppy/core";
import "@uppy/core/dist/style.css";
import "@uppy/progress-bar/dist/style.css";
import { DragDrop, ProgressBar } from "@uppy/react";
import { Field, FieldProps, Form, Formik } from "formik";
import gql from "graphql-tag";
import React, { useEffect, useMemo, useState } from "react";
import { useSelectRequiredItemQuery } from "../../generated/graphql";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import UnsavedChangesWarning from "../LeavingPageWarnings/UnsavedChangesWarning";

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
    const [files, setFiles] = useState<string[]>([]);

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
                allowedFileTypes: [".mp4"],
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

    useEffect(() => {
        uppy?.on("file-added", () =>
            setFiles(uppy.getFiles().map((file) => file.name))
        );
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
                    <Heading as="h2">
                        {data?.RequiredContentItem[0].name}
                    </Heading>
                    <DragDrop uppy={uppy as Uppy.Uppy} />
                    <p>{files.join(", ")}</p>
                    <ProgressBar
                        uppy={uppy as Uppy.Uppy}
                        fixed
                        hideAfterFinish
                    />
                    <Button
                        onClick={async () => {
                            await uppy?.upload();
                        }}
                    >
                        Upload
                    </Button>
                    <Formik
                        initialValues={{
                            agree: false,
                            file: null,
                        }}
                        onSubmit={async (values) => {
                            console.log(values);
                        }}
                    >
                        {({ dirty, ...props }) => (
                            <>
                                <UnsavedChangesWarning
                                    hasUnsavedChanges={dirty}
                                />
                                <Form>
                                    <Field name="agree">
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
                                                <FormLabel htmlFor="name">
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
                                                    {form.errors.name}
                                                </FormErrorMessage>
                                            </FormControl>
                                        )}
                                    </Field>
                                    <Field name="file">
                                        {({ form, field }: FieldProps) => (
                                            <FormControl />
                                        )}
                                    </Field>
                                </Form>
                            </>
                        )}
                    </Formik>
                </>
            )}
        </>
    );
}

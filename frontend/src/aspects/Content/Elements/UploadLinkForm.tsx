import { Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, useToast } from "@chakra-ui/react";
import type { FieldProps } from "formik";
import { Field, Form, Formik } from "formik";
import React from "react";
import { useSubmitUploadableElementMutation } from "../../../generated/graphql";
import UnsavedChangesWarning from "../../LeavingPageWarnings/UnsavedChangesWarning";
import UploadAgreementField from "./UploadAgreementField";

export default function UploadLinkForm({
    magicToken,
    uploadAgreementText,
    uploadAgreementUrl,
    handleFormSubmitted,
    existingLink,
}: {
    magicToken: string;
    uploadAgreementText?: string;
    uploadAgreementUrl?: string;
    handleFormSubmitted?: () => void;
    existingLink: {
        text: string;
        url: string;
    } | null;
}): JSX.Element {
    const toast = useToast();
    const [_submitUploadableElementResponse, submitUploadableElement] = useSubmitUploadableElementMutation();
    return (
        <>
            <Formik
                initialValues={{
                    text: existingLink?.text ?? null,
                    url: existingLink?.url ?? null,
                    agree: null,
                }}
                onSubmit={async (values) => {
                    try {
                        const submitResult = await submitUploadableElement({
                            elementData: {
                                text: values.text,
                                url: values.url,
                            },
                            magicToken,
                        });

                        if (submitResult.error || !submitResult.data?.submitUploadableElement?.success) {
                            throw new Error(
                                submitResult.data?.submitUploadableElement?.message ??
                                    submitResult.error?.message ??
                                    "Unknown reason for failure."
                            );
                        }

                        toast({
                            status: "success",
                            description: "Submitted item successfully.",
                        });

                        if (handleFormSubmitted) {
                            handleFormSubmitted();
                        }
                    } catch (e: any) {
                        console.error("Failed to submit item", e);
                        toast({
                            status: "error",
                            title: "Failed to submit item.",
                            description: e?.message ?? "Please try again later.",
                        });
                    }
                }}
            >
                {({ dirty, ...props }) => (
                    <>
                        <UnsavedChangesWarning hasUnsavedChanges={dirty} />
                        <Form
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                marginTop: "2em",
                            }}
                        >
                            <Field name="text">
                                {({ form, field }: FieldProps<string>) => (
                                    <FormControl
                                        isInvalid={!!form.errors.text && !!form.touched.text}
                                        isRequired
                                        mt={5}
                                    >
                                        <FormLabel htmlFor="text">Text</FormLabel>
                                        <Input {...field} id="text" />
                                        <FormHelperText>Display text for the link.</FormHelperText>
                                        <FormErrorMessage>{form.errors.text}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field
                                name="url"
                                validate={(inValue: string | null | undefined) => {
                                    if (!inValue) {
                                        return "Missing URL";
                                    }

                                    try {
                                        new URL(inValue);
                                    } catch (e) {
                                        return "Invalid URL";
                                    }
                                    return undefined;
                                }}
                            >
                                {({ form, field }: FieldProps<string>) => (
                                    <FormControl isInvalid={!!form.errors.url && !!form.touched.url} isRequired mt={5}>
                                        <FormLabel htmlFor="url">URL</FormLabel>
                                        <Input {...field} id="url" />
                                        <FormHelperText>URL of the link.</FormHelperText>
                                        <FormErrorMessage>{form.errors.url}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <UploadAgreementField
                                uploadAgreementText={uploadAgreementText}
                                uploadAgreementUrl={uploadAgreementUrl}
                            />
                            <Button
                                mt={4}
                                colorScheme="ConfirmButton"
                                isLoading={props.isSubmitting}
                                type="submit"
                                isDisabled={!props.isValid || !dirty}
                            >
                                Submit
                            </Button>
                        </Form>
                    </>
                )}
            </Formik>
        </>
    );
}

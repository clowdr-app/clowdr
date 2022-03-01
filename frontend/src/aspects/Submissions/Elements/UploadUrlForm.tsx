import { Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, useToast } from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import type { FieldProps } from "formik";
import { Field, Form, Formik } from "formik";
import React, { useMemo } from "react";
import { useSubmitUploadableElementMutation } from "../../../generated/graphql";
import { makeContext } from "../../GQL/make-context";
import UnsavedChangesWarning from "../../LeavingPageWarnings/UnsavedChangesWarning";
import UploadAgreementField from "./UploadAgreementField";

export default function UploadUrlForm({
    elementId,
    magicToken,
    uploadAgreementText,
    uploadAgreementUrl,
    handleFormSubmitted,
    existingUrl,
}: {
    elementId: string;
    magicToken: string;
    uploadAgreementText?: string;
    uploadAgreementUrl?: string;
    handleFormSubmitted?: () => void;
    existingUrl: { url: string; title?: string } | null;
}): JSX.Element {
    const toast = useToast();
    const context = useMemo(() => makeContext({ [AuthHeader.MagicToken]: magicToken }), [magicToken]);
    const [_submitUploadableElementResponse, submitUploadableElement] = useSubmitUploadableElementMutation();
    return (
        <>
            <Formik
                initialValues={{
                    url: existingUrl?.url ?? null,
                    title: existingUrl?.title ?? null,
                    agree: null,
                }}
                onSubmit={async (values) => {
                    try {
                        const submitResult = await submitUploadableElement(
                            {
                                elementData: {
                                    url: values.url,
                                    title: values.title,
                                },
                                magicToken,
                                elementId,
                            },
                            context
                        );

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
                                        <FormHelperText>URL.</FormHelperText>
                                        <FormErrorMessage>{form.errors.url}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <Field
                                name="title"
                                validate={(inValue: string | null | undefined) => {
                                    return inValue?.length ? undefined : "Missing title for accessibility";
                                }}
                            >
                                {({ form, field }: FieldProps<string>) => (
                                    <FormControl
                                        isInvalid={!!form.errors.title && !!form.touched.title}
                                        isRequired
                                        mt={5}
                                    >
                                        <FormLabel htmlFor="title">URL Title (for accessibility)</FormLabel>
                                        <Input {...field} id="title" />
                                        <FormHelperText>Title.</FormHelperText>
                                        <FormErrorMessage>{form.errors.title}</FormErrorMessage>
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

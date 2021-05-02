import {
    Button,
    Checkbox,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Input,
    Text,
    useToast,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React from "react";
import { usesubmitUploadableElementMutation } from "../../generated/graphql";
import UnsavedChangesWarning from "../LeavingPageWarnings/UnsavedChangesWarning";

export default function UploadUrlForm({
    magicToken,
    uploadAgreement,
    handleFormSubmitted,
}: {
    magicToken: string;
    uploadAgreement?: string;
    handleFormSubmitted?: () => Promise<void>;
}): JSX.Element {
    const toast = useToast();
    const [submitUploadableElement] = usesubmitUploadableElementMutation();
    return (
        <>
            <Formik
                initialValues={{
                    url: null,
                    agree: null,
                }}
                onSubmit={async (values) => {
                    try {
                        const submitResult = await submitUploadableElement({
                            variables: {
                                elementData: {
                                    url: values.url,
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
                            description: "Submitted item successfully.",
                        });

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
                    }
                }}
            >
                {({ dirty, ...props }) => (
                    <>
                        <UnsavedChangesWarning hasUnsavedChanges={dirty} />
                        <Form>
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
                                }}
                            >
                                {({ form, field }: FieldProps<string>) => (
                                    <FormControl isInvalid={!!form.errors.url && !!form.touched.url} isRequired mt={5}>
                                        <FormLabel htmlFor="url">URL</FormLabel>
                                        <Input {...field} id="url"></Input>
                                        <FormHelperText>URL.</FormHelperText>
                                        <FormErrorMessage>{form.errors.url}</FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
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
                                            mt={5}
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
                            <Button
                                mt={4}
                                colorScheme="green"
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

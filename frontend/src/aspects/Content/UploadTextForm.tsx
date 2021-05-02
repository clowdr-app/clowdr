import {
    Button,
    Checkbox,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Text,
    Textarea,
    useToast,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React from "react";
import { usesubmitUploadableElementMutation } from "../../generated/graphql";
import UnsavedChangesWarning from "../LeavingPageWarnings/UnsavedChangesWarning";

export default function UploadTextForm({
    magicToken,
    uploadAgreement,
}: {
    magicToken: string;
    uploadAgreement?: string;
}): JSX.Element {
    const toast = useToast();
    const [submitUploadableElement] = usesubmitUploadableElementMutation();
    return (
        <>
            <Formik
                initialValues={{
                    text: null,
                }}
                onSubmit={async (values) => {
                    try {
                        const submitResult = await submitUploadableElement({
                            variables: {
                                elementData: {
                                    text: values.text,
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
                            <Field name="text">
                                {({ form, field }: FieldProps<string>) => (
                                    <FormControl
                                        isInvalid={!!form.errors.text && !!form.touched.text}
                                        isRequired
                                        mt={5}
                                    >
                                        <FormLabel htmlFor="text">Text</FormLabel>
                                        {/* TODO: Use Markdown editor instead of a textarea */}
                                        <Textarea transition="none" {...field} id="text"></Textarea>
                                        <FormHelperText>Text to submit.</FormHelperText>
                                        <FormErrorMessage>{form.errors.text}</FormErrorMessage>
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

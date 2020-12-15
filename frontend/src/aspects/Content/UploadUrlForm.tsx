import {
    Button,
    Checkbox,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Input,
    useToast,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React from "react";
import { useSubmitContentItemMutation } from "../../generated/graphql";
import UnsavedChangesWarning from "../LeavingPageWarnings/UnsavedChangesWarning";

export default function UploadUrlForm({
    magicToken,
}: {
    magicToken: string;
}): JSX.Element {
    const toast = useToast();
    const [submitContentItem] = useSubmitContentItemMutation();
    return (
        <>
            <Formik
                initialValues={{
                    url: null,
                    agree: null,
                }}
                onSubmit={async (values) => {
                    try {
                        const submitResult = await submitContentItem({
                            variables: {
                                contentItemData: {
                                    url: values.url,
                                },
                                magicToken,
                            },
                        });

                        if (
                            submitResult.errors ||
                            !submitResult.data?.submitContentItem?.success
                        ) {
                            console.error(
                                "Failed to submit item",
                                submitResult.errors,
                                submitResult.data?.submitContentItem?.message
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
                        }

                        toast({
                            status: "success",
                            description: "Submitted item successfully.",
                        });
                    } catch (e) {
                        console.error("Failed to submit item", e);
                        toast({
                            status: "error",
                            description:
                                "Failed to submit item. Please try again later.",
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
                                validate={(
                                    inValue: string | null | undefined
                                ) => {
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
                                    <FormControl
                                        isInvalid={
                                            !!form.errors.url &&
                                            !!form.touched.url
                                        }
                                        isRequired
                                        mt={5}
                                    >
                                        <FormLabel htmlFor="url">URL</FormLabel>
                                        <Input {...field} id="url"></Input>
                                        <FormHelperText>URL.</FormHelperText>
                                        <FormErrorMessage>
                                            {form.errors.url}
                                        </FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
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
                                {({ form, field }: FieldProps<string>) => (
                                    <FormControl
                                        isInvalid={
                                            !!form.errors.agree &&
                                            !!form.touched.agree
                                        }
                                        isRequired
                                        mt={5}
                                    >
                                        <FormLabel htmlFor="agree">
                                            Agree?
                                        </FormLabel>
                                        <Checkbox {...field} id="agree" />
                                        <FormHelperText>
                                            Whether you agree to the upload
                                            conditions.
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
                                Submit
                            </Button>
                        </Form>
                    </>
                )}
            </Formik>
        </>
    );
}

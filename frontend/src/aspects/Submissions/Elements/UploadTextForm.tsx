import { InfoIcon } from "@chakra-ui/icons";
import {
    Button,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Heading,
    HStack,
    Link,
    Text,
    Textarea,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import type { FieldProps } from "formik";
import { Field, Form, Formik } from "formik";
import React, { useMemo } from "react";
import { useSubmitUploadableElementMutation } from "../../../generated/graphql";
import { Markdown } from "../../Chakra/Markdown";
import { makeContext } from "../../GQL/make-context";
import UnsavedChangesWarning from "../../LeavingPageWarnings/UnsavedChangesWarning";
import UploadAgreementField from "./UploadAgreementField";

export default function UploadTextForm({
    elementId,
    magicToken,
    uploadAgreementText,
    uploadAgreementUrl,
    existingText,
    handleFormSubmitted,
}: {
    elementId: string;
    magicToken: string;
    uploadAgreementText?: string;
    uploadAgreementUrl?: string;
    existingText: { text: string } | null;
    handleFormSubmitted?: () => void;
}): JSX.Element {
    const toast = useToast();
    const context = useMemo(() => makeContext({ [AuthHeader.MagicToken]: magicToken }), [magicToken]);
    const [_submitUploadableElementResponse, submitUploadableElement] = useSubmitUploadableElementMutation();
    return (
        <>
            <Formik
                initialValues={{
                    text: existingText?.text ?? null,
                }}
                onSubmit={async (values) => {
                    try {
                        const submitResult = await submitUploadableElement(
                            {
                                elementData: {
                                    text: values.text,
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
                            <Field name="text">
                                {({ form, field }: FieldProps<string>) => (
                                    <HStack
                                        justifyContent="center"
                                        alignItems="flex-start"
                                        w="100%"
                                        flexWrap="wrap"
                                        spacing={6}
                                        mb={3}
                                    >
                                        <FormControl
                                            isInvalid={!!form.errors.text && !!form.touched.text}
                                            isRequired
                                            mb={10}
                                            maxW="40em"
                                        >
                                            <FormLabel htmlFor="text" fontWeight="bold">
                                                Text
                                            </FormLabel>
                                            {/* TODO: Use Markdown editor instead of a textarea */}
                                            <Textarea transition="none" {...field} id="text"></Textarea>
                                            <FormHelperText>
                                                Text may be formatted using{" "}
                                                <Link
                                                    isExternal
                                                    href="https://daringfireball.net/projects/markdown/basics"
                                                >
                                                    Markdown
                                                </Link>
                                                .<br />
                                                <br />
                                                Using Markdown you can bold text, create bulleted or numbered lists,
                                                link to another website, embed external images and more.
                                                <br />
                                                <br />
                                                On Midspace, you can also use Markdown to embed YouTube videos, using
                                                the same syntax as for images.
                                            </FormHelperText>
                                            <FormErrorMessage>{form.errors.text}</FormErrorMessage>
                                        </FormControl>
                                        <VStack maxW="40em" alignItems="flex-start" mb={10}>
                                            <Heading as="h4" fontSize="md" textAlign="left">
                                                Preview
                                            </Heading>
                                            <Text fontStyle="italic" fontSize="sm">
                                                <InfoIcon mr={1} mb={1} />
                                                Please note, as per any ordinary website, text will reflow automatically
                                                to fit the size of the reader&apos;s screen.
                                            </Text>
                                            <Markdown autoLinkify>{field.value}</Markdown>
                                        </VStack>
                                    </HStack>
                                )}
                            </Field>
                            <UploadAgreementField
                                uploadAgreementText={uploadAgreementText}
                                uploadAgreementUrl={uploadAgreementUrl}
                            />
                            <Button
                                my={4}
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

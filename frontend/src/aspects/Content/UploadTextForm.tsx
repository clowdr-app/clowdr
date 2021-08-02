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
import { Field, FieldProps, Form, Formik } from "formik";
import React from "react";
import { useSubmitUploadableElementMutation } from "../../generated/graphql";
import UnsavedChangesWarning from "../LeavingPageWarnings/UnsavedChangesWarning";
import { Markdown } from "../Text/Markdown";
import UploadAgreementField from "./UploadAgreementField";

export default function UploadTextForm({
    magicToken,
    uploadAgreementText,
    uploadAgreementUrl,
    existingText,
}: {
    magicToken: string;
    uploadAgreementText?: string;
    uploadAgreementUrl?: string;
    existingText: { text: string } | null;
}): JSX.Element {
    const toast = useToast();
    const [submitUploadableElement] = useSubmitUploadableElementMutation();
    return (
        <>
            <Formik
                initialValues={{
                    text: existingText?.text ?? null,
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
                        <Form
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
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
                                                link to other website, embed external images and more.
                                                <br />
                                                <br />
                                                On Clowdr, you can also use Markdown to embed YouTube videos, using the
                                                same syntax as for images.
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
                                            <Markdown>{field.value}</Markdown>
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
                                colorScheme="purple"
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

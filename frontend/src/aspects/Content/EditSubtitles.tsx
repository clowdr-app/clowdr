import { gql } from "@apollo/client";
import {
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Spinner,
    Textarea,
    useToast,
} from "@chakra-ui/react";
import type { SubtitleDetails } from "@clowdr-app/shared-types/types/content";
import AmazonS3Uri from "amazon-s3-uri";
import { Field, FieldProps, Form, Formik } from "formik";
import React from "react";
import useFetch from "use-http";
import { useUpdateSubtitlesMutation } from "../../generated/graphql";
import UnsavedChangesWarning from "../LeavingPageWarnings/UnsavedChangesWarning";

gql`
    mutation UpdateSubtitles(
        $contentItemId: String!
        $magicToken: String!
        $subtitleText: String!
    ) {
        updateSubtitles(
            contentItemId: $contentItemId
            magicToken: $magicToken
            subtitleText: $subtitleText
        ) {
            message
            success
        }
    }
`;

export default function EditSubtitles({
    data,
    contentItemId,
    magicToken,
}: {
    data: SubtitleDetails;
    contentItemId: string;
    magicToken: string;
}): JSX.Element {
    const [updateSubtitles] = useUpdateSubtitlesMutation();
    const toast = useToast();

    const { bucket, key } = AmazonS3Uri(data.s3Url);
    const subtitlesUrl = `https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`;
    const { loading, error, data: subtitlesData = [] } = useFetch(
        subtitlesUrl,
        {},
        []
    );

    return loading ? (
        <Spinner />
    ) : error ? (
        <>Could not load subtitles.</>
    ) : (
        <>
            <Formik
                initialValues={{
                    subtitles: subtitlesData,
                }}
                onSubmit={async (values) => {
                    try {
                        const submitResult = await updateSubtitles({
                            variables: {
                                contentItemId,
                                magicToken,
                                subtitleText: values.subtitles,
                            },
                        });

                        if (
                            submitResult.errors ||
                            !submitResult.data?.updateSubtitles?.success
                        ) {
                            console.error(
                                "Failed to update subtitles",
                                submitResult.errors,
                                submitResult.data?.updateSubtitles?.message
                            );
                            toast({
                                status: "error",
                                description:
                                    "Failed to update subtitles. Please try again later.",
                            });
                            return;
                        }

                        toast({
                            status: "success",
                            description: "Updated subtitles successfully.",
                        });
                        return;
                    } catch (e) {
                        console.error("Failed to update subtitles", e);
                        toast({
                            status: "error",
                            description:
                                "Failed to update subtitles. Please try again later.",
                        });
                        return;
                    }
                }}
            >
                {({ dirty, ...props }) => (
                    <>
                        <UnsavedChangesWarning hasUnsavedChanges={dirty} />
                        <Form style={{ width: "100%" }}>
                            <Field
                                name="subtitles"
                                validate={(
                                    inValue: string | null | undefined
                                ) => {
                                    return inValue ? undefined : inValue;
                                }}
                            >
                                {({ form, field }: FieldProps<string>) => (
                                    <FormControl
                                        mt={5}
                                        isInvalid={
                                            !!form.errors.agree &&
                                            !!form.touched.agree
                                        }
                                        isRequired
                                    >
                                        <FormLabel htmlFor="subtitles">
                                            Subtitles
                                        </FormLabel>
                                        <Textarea
                                            {...field}
                                            id="subtitles"
                                            height={300}
                                        />
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
                                Update subtitles
                            </Button>
                        </Form>
                    </>
                )}
            </Formik>
        </>
    );
}

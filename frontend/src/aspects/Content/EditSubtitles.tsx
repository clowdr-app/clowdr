import { gql } from "@apollo/client";
import TranscriptEditor from "@bbc/react-transcript-editor/dist/TranscriptEditor";
import { Box, Spinner } from "@chakra-ui/react";
import type { SubtitleDetails } from "@clowdr-app/shared-types/build/content";
import AmazonS3Uri from "amazon-s3-uri";
import assert from "assert";
import React from "react";
import useFetch from "use-http";

gql`
    mutation UpdateSubtitles($contentItemId: String!, $magicToken: String!, $subtitleText: String!) {
        updateSubtitles(contentItemId: $contentItemId, magicToken: $magicToken, subtitleText: $subtitleText) {
            message
            success
        }
    }
`;

export default function EditSubtitles({
    videoS3URL,
    data,
    contentItemId,
    magicToken,
}: {
    videoS3URL: string;
    data: SubtitleDetails;
    contentItemId: string;
    magicToken: string;
}): JSX.Element {
    // TODO: const [updateSubtitles] = useUpdateSubtitlesMutation();
    // TODO: const toast = useToast();

    const { bucket: _srtBucket, key: _srtKey } = AmazonS3Uri(data.s3Url);
    const { bucket: videoBucket, key: videoKey } = AmazonS3Uri(videoS3URL);
    assert(videoKey);
    const videoUrl = `https://${videoBucket}.s3-eu-west-1.amazonaws.com/${videoKey}`;
    // TODO: Re-enable: const subtitlesUrl = `https://${_srtBucket}.s3.eu-west-1.amazonaws.com/${_srtKey}`;
    const subtitlesUrl = `https://${videoBucket}.s3-eu-west-1.amazonaws.com/${videoKey.substr(
        0,
        videoKey.length - 4
    )}.json`;
    const { loading, error, data: subtitlesData = [] } = useFetch(subtitlesUrl, {}, []);

    return loading ? (
        <Spinner />
    ) : error ? (
        <>Could not load subtitles.</>
    ) : (
        <Box color="black">
            <TranscriptEditor
                isEditable
                transcriptData={subtitlesData}
                mediaUrl={videoUrl}
                sttJsonType="amazontranscribe" // TODO: SRT
                spellCheck
                autoSaveContentType="sttJsonType"
                handleAutoSaveChanges={(data) => {
                    // TODO: Save changes
                    console.log(data);
                }}
            />
            {/* <Formik
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

                        if (submitResult.errors || !submitResult.data?.updateSubtitles?.success) {
                            console.error(
                                "Failed to update subtitles",
                                submitResult.errors,
                                submitResult.data?.updateSubtitles?.message
                            );
                            toast({
                                status: "error",
                                description: "Failed to update subtitles. Please try again later.",
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
                            description: "Failed to update subtitles. Please try again later.",
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
                                validate={(inValue: string | null | undefined) => {
                                    let error;

                                    if (!inValue) {
                                        return;
                                    }

                                    const srtErrors = srtValidator(inValue);
                                    if (srtErrors.length > 0) {
                                        console.log("Invalid SRT", srtErrors);
                                        error = "Invalid SRT";
                                    }

                                    return error;
                                }}
                            >
                                {({ form, field }: FieldProps<string>) => (
                                    <FormControl
                                        mt={5}
                                        isInvalid={!!form.errors.subtitles && !!form.touched.subtitles}
                                        isRequired
                                    >
                                        <FormLabel htmlFor="subtitles">Subtitles</FormLabel>
                                        <Textarea {...field} id="subtitles" height={300} />
                                        <FormHelperText>Subtitles must be in SRT format.</FormHelperText>
                                        <FormErrorMessage>{form.errors.subtitles}</FormErrorMessage>
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
            </Formik> */}
        </Box>
    );
}

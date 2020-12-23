import { gql } from "@apollo/client";
import { Box, Button, Spinner, useToast } from "@chakra-ui/react";
import type { SubtitleDetails } from "@clowdr-app/shared-types/build/content";
import AmazonS3Uri from "amazon-s3-uri";
import assert from "assert";
import { Form, Formik } from "formik";
import React, { useRef } from "react";
import useFetch from "use-http";
import { useUpdateSubtitlesMutation } from "../../generated/graphql";
import TranscriptEditor from "../../TranscriptEditor";

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
    const [updateSubtitles] = useUpdateSubtitlesMutation();
    const toast = useToast();
    const transcriptEditorRef = useRef<HTMLElement | null>(null);

    const { bucket: _srtBucket, key: _srtKey } = AmazonS3Uri(data.s3Url);
    const { bucket: videoBucket, key: videoKey } = AmazonS3Uri(videoS3URL);
    assert(videoKey);
    const videoUrl = `https://${videoBucket}.s3-eu-west-1.amazonaws.com/${videoKey}`;
    const subtitlesUrl = `https://${_srtBucket}.s3.eu-west-1.amazonaws.com/${_srtKey}`;
    const { loading, error, data: subtitlesData = [] } = useFetch(subtitlesUrl, {}, []);

    return loading && !subtitlesData ? (
        <Spinner />
    ) : error ? (
        <>Could not load subtitles.</>
    ) : (
        <Box color="black">
            <Formik
                initialValues={{}}
                onSubmit={async (_values) => {
                    try {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        const { data } = transcriptEditorRef.current.getEditorContent("srt");

                        const submitResult = await updateSubtitles({
                            variables: {
                                contentItemId,
                                magicToken,
                                subtitleText: data,
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
                isInitialValid={true}
            >
                {({ isSubmitting }) => (
                    <>
                        <TranscriptEditor
                            isEditable
                            transcriptData={{ data: subtitlesData }}
                            mediaUrl={videoUrl}
                            sttJsonType="srt" // TODO: SRT
                            spellCheck
                            autoSaveContentType="draftjs"
                            handleAutoSaveChanges={(_data: any) => {
                                // TODO: Save changes
                                //console.log(data);
                            }}
                            ref={transcriptEditorRef}
                        />
                        <Form style={{ width: "100%" }}>
                            <Button mt={4} colorScheme="green" isLoading={isSubmitting} type="submit">
                                Update subtitles
                            </Button>
                        </Form>
                    </>
                )}
            </Formik>
        </Box>
    );
}

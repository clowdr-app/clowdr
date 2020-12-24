import { gql } from "@apollo/client";
import { Box, Spinner, useToast } from "@chakra-ui/react";
import type { SubtitleDetails } from "@clowdr-app/shared-types/build/content";
import AmazonS3Uri from "amazon-s3-uri";
import assert from "assert";
import React, { useState } from "react";
import useFetch from "use-http";
import { useUpdateSubtitlesMutation } from "../../generated/graphql";
import TranscriptEditor from "../../TranscriptEditor";
import UnsavedChangesWarning from "../LeavingPageWarnings/UnsavedChangesWarning";

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
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

    const { bucket: _srtBucket, key: _srtKey } = AmazonS3Uri(data.s3Url);
    const { bucket: videoBucket, key: videoKey } = AmazonS3Uri(videoS3URL);
    assert(videoKey);
    const videoUrl = `https://${videoBucket}.s3-eu-west-1.amazonaws.com/${videoKey}`;
    const subtitlesUrl = `https://${_srtBucket}.s3.eu-west-1.amazonaws.com/${_srtKey}`;
    const { loading, error, data: subtitlesData = "" } = useFetch(subtitlesUrl, {}, []);

    return loading && !subtitlesData ? (
        <Spinner />
    ) : error || subtitlesData === "" ? (
        <>Could not load subtitles.</>
    ) : (
        <Box color="black">
            <UnsavedChangesWarning hasUnsavedChanges={hasUnsavedChanges} />
            <TranscriptEditor
                srtTranscript={subtitlesData}
                mediaUrl={videoUrl}
                handleSaveEditor={async (srtTranscript: string) => {
                    try {
                        const result = await updateSubtitles({
                            variables: {
                                contentItemId,
                                magicToken,
                                subtitleText: srtTranscript,
                            },
                        });
                        if (result.data?.updateSubtitles?.success) {
                            toast({
                                description: "Saved subtitles",
                                status: "success",
                            });
                        } else {
                            throw new Error(result.data?.updateSubtitles?.message ?? "Failed for unknown reason");
                        }
                        setHasUnsavedChanges(false);
                    } catch (e) {
                        console.error("Failed to save subtitles", e);
                        toast({
                            description: "Failed to save subtitles",
                            status: "error",
                        });
                    }
                }}
                handleChange={() => setHasUnsavedChanges(true)}
            />
        </Box>
    );
}

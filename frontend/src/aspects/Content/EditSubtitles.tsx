import { gql } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    ListItem,
    Spinner,
    Text,
    UnorderedList,
    useToast,
} from "@chakra-ui/react";
import type { SubtitleDetails } from "@clowdr-app/shared-types/build/content";
import AmazonS3Uri from "amazon-s3-uri";
import assert from "assert";
import React, { useState } from "react";
import useFetch from "use-http";
import { useUpdateSubtitlesMutation } from "../../generated/graphql";
import TranscriptEditor from "../../TranscriptEditor";
import UnsavedChangesWarning from "../LeavingPageWarnings/UnsavedChangesWarning";

gql`
    mutation UpdateSubtitles($elementId: String!, $magicToken: String!, $subtitleText: String!) {
        updateSubtitles(elementId: $elementId, magicToken: $magicToken, subtitleText: $subtitleText) {
            message
            success
        }
    }
`;

export default function EditSubtitles({
    videoS3URL,
    data,
    elementId,
    magicToken,
}: {
    videoS3URL: string;
    data: SubtitleDetails;
    elementId: string;
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

    return (
        <>
            {loading ? <Spinner /> : undefined}
            {error || (!loading && !error && !subtitlesData) ? <Text>Could not load subtitles.</Text> : undefined}
            {subtitlesData ? (
                <Box>
                    <UnsavedChangesWarning hasUnsavedChanges={hasUnsavedChanges} />
                    <Alert status="info" my={2}>
                        <AlertIcon />
                        <Box flex="1">
                            <AlertTitle>Tips for editing your subtitles</AlertTitle>
                            <AlertDescription display="block">
                                <Text>
                                    There are a few things to keep in mind while you are editing your subtitles.
                                </Text>
                                <UnorderedList>
                                    <ListItem>
                                        Due to a known issue, you should avoid adding or removing lines from the
                                        transcript. This will help to ensure that your subtitle timings remain correct.
                                    </ListItem>
                                    <ListItem>
                                        It&apos;s best to keep to 1 line per timecode, and a maximum line length of
                                        about 80 characters.
                                    </ListItem>
                                </UnorderedList>
                            </AlertDescription>
                        </Box>
                    </Alert>
                    <Box color="black">
                        <TranscriptEditor
                            srtTranscript={subtitlesData}
                            mediaUrl={videoUrl}
                            handleSaveEditor={async (srtTranscript: string) => {
                                try {
                                    const result = await updateSubtitles({
                                        variables: {
                                            elementId,
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
                                        throw new Error(
                                            result.data?.updateSubtitles?.message ?? "Failed for unknown reason"
                                        );
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
                </Box>
            ) : undefined}
        </>
    );
}

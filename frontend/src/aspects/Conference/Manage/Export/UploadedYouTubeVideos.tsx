import { gql } from "@apollo/client";
import { Heading, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { default as React } from "react";
import {
    UploadYouTubeVideos_YouTubeUploadFragment,
    useUploadYouTubeVideos_GetYouTubeUploadsQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useConference } from "../../useConference";

gql`
    query UploadYouTubeVideos_GetYouTubeUploads($conferenceId: uuid!) {
        YouTubeUpload(where: { conferenceId: { _eq: $conferenceId } }) {
            ...UploadYouTubeVideos_YouTubeUpload
        }
    }

    fragment UploadYouTubeVideos_YouTubeUpload on YouTubeUpload {
        id
        videoId
        videoPrivacyStatus
        videoStatus
        videoTitle
        contentItem {
            id
            name
            contentGroup {
                id
                title
            }
        }
    }
`;

export function UploadedYouTubeVideos(): JSX.Element {
    const conference = useConference();
    const youtubeUploadsResult = useUploadYouTubeVideos_GetYouTubeUploadsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    return (
        <>
            <Heading as="h2" size="md" textAlign="left" mt={4} mb={2}>
                Uploaded videos
            </Heading>

            <ApolloQueryWrapper queryResult={youtubeUploadsResult} getter={(result) => result.YouTubeUpload}>
                {(uploads: readonly UploadYouTubeVideos_YouTubeUploadFragment[]) => (
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>YouTube ID</Th>
                                <Th>Privacy</Th>
                                <Th>Status</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {uploads.map((upload) => (
                                <Tr key={upload.id}>
                                    <Td>{upload.id}</Td>
                                    <Td>{upload.videoPrivacyStatus}</Td>
                                    <Td>{upload.videoStatus}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </ApolloQueryWrapper>
        </>
    );
}

import { gql } from "@apollo/client";
import { Heading, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { default as React } from "react";
import ReactPlayer from "react-player";
import {
    UploadYouTubeVideos_YouTubeUploadFragment,
    useUploadYouTubeVideos_GetYouTubeUploadsQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useConference } from "../../useConference";

gql`
    query UploadYouTubeVideos_GetYouTubeUploads($conferenceId: uuid!) {
        video_YouTubeUpload(where: { conferenceId: { _eq: $conferenceId } }) {
            ...UploadYouTubeVideos_YouTubeUpload
        }
    }

    fragment UploadYouTubeVideos_YouTubeUpload on video_YouTubeUpload {
        id
        videoId
        videoPrivacyStatus
        videoStatus
        videoTitle
        element {
            id
            name
            item {
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

            <ApolloQueryWrapper queryResult={youtubeUploadsResult} getter={(result) => result.video_YouTubeUpload}>
                {(uploads: readonly UploadYouTubeVideos_YouTubeUploadFragment[]) => (
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>YouTube ID</Th>
                                <Th>Privacy</Th>
                                <Th>Preview</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {uploads.map((upload) => (
                                <Tr key={upload.id}>
                                    <Td>{upload.videoTitle}</Td>
                                    <Td>{upload.videoPrivacyStatus}</Td>
                                    <Td>
                                        {/* TODO: Chakra AspectRatio */}
                                        <ReactPlayer
                                            url={`https://youtube.com/watch?v=${upload.videoId}`}
                                            width="300px"
                                            height="auto"
                                        />
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </ApolloQueryWrapper>
        </>
    );
}

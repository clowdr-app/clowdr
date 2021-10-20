import { gql } from "@apollo/client";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Link, Spinner, Table, Tbody, Td, Th, Thead, Tooltip, Tr, VStack } from "@chakra-ui/react";
import { default as React, useCallback } from "react";
import ReactPlayer from "react-player";
import type {
    UploadYouTubeVideos_UploadYouTubeVideoJobFragment,
    UploadYouTubeVideos_YouTubeUploadFragment} from "../../../../../generated/graphql";
import {
    useUploadYouTubeVideos_GetUploadYouTubeVideoJobsQuery,
    Video_JobStatus_Enum,
} from "../../../../../generated/graphql";
import ApolloQueryWrapper from "../../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useTitle } from "../../../../Utils/useTitle";
import { useConference } from "../../../useConference";
import { DashboardPage } from "../../DashboardPage";

gql`
    query UploadYouTubeVideos_GetUploadYouTubeVideoJobs($conferenceId: uuid!) {
        job_queues_UploadYouTubeVideoJob(
            where: { conferenceId: { _eq: $conferenceId } }
            order_by: { createdAt: desc }
            limit: 100
        ) {
            ...UploadYouTubeVideos_UploadYouTubeVideoJob
        }
    }

    fragment UploadYouTubeVideos_YouTubeUpload on video_YouTubeUpload {
        id
        videoId
        videoPrivacyStatus
        videoStatus
        videoTitle
    }

    fragment UploadYouTubeVideos_UploadYouTubeVideoJob on job_queues_UploadYouTubeVideoJob {
        id
        jobStatusName
        message
        element {
            id
            name
        }
        youTubeUploads {
            ...UploadYouTubeVideos_YouTubeUpload
        }
    }
`;

export function UploadedPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`YouTube Uploads from ${conference.shortName}`);
    const existingJobsResult = useUploadYouTubeVideos_GetUploadYouTubeVideoJobsQuery({
        variables: {
            conferenceId: conference.id,
        },
        pollInterval: 20000,
    });

    const jobStatus = useCallback((jobStatusName: Video_JobStatus_Enum) => {
        switch (jobStatusName) {
            case Video_JobStatus_Enum.Completed:
                return (
                    <Tooltip label="Upload completed">
                        <FAIcon icon="check-circle" iconStyle="s" aria-label="completed" color="green.500" />
                    </Tooltip>
                );
            case Video_JobStatus_Enum.Expired:
            case Video_JobStatus_Enum.Failed:
                return (
                    <Tooltip label="Upload failed">
                        <FAIcon icon="exclamation-circle" iconStyle="s" aria-label="error" color="red.500" />
                    </Tooltip>
                );
            case Video_JobStatus_Enum.InProgress:
            case Video_JobStatus_Enum.New:
                return <Spinner size="sm" aria-label="in progress" />;
        }
    }, []);

    return (
        <DashboardPage title="Uploads">
            {title}
            <VStack alignItems="stretch" w="100%">
                <ApolloQueryWrapper
                    queryResult={existingJobsResult}
                    getter={(result) =>
                        result.job_queues_UploadYouTubeVideoJob.flatMap((job) =>
                            job.youTubeUploads.length
                                ? job.youTubeUploads.map(
                                      (upload: UploadYouTubeVideos_YouTubeUploadFragment | null) => ({
                                          job,
                                          upload,
                                      })
                                  )
                                : { job, upload: null }
                        )
                    }
                >
                    {(
                        uploads: {
                            job: UploadYouTubeVideos_UploadYouTubeVideoJobFragment;
                            upload: UploadYouTubeVideos_YouTubeUploadFragment | null;
                        }[]
                    ) => (
                        <Table>
                            <Thead>
                                <Tr>
                                    <Th>Video</Th>
                                    <Th>Status</Th>
                                    <Th>Privacy</Th>
                                    <Th>Preview</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {uploads.map(({ job, upload }) => (
                                    <Tr key={`${job.id}-${upload?.id}`}>
                                        <Td>
                                            {upload ? (
                                                <Link
                                                    as="a"
                                                    isExternal
                                                    href={`https://youtube.com/watch?v=${upload.videoId}`}
                                                >
                                                    {upload.videoTitle} <ExternalLinkIcon mx="2px" />
                                                </Link>
                                            ) : (
                                                job.element?.name
                                            )}
                                        </Td>
                                        <Td>{jobStatus(job.jobStatusName)}</Td>
                                        <Td>{upload?.videoPrivacyStatus}</Td>
                                        <Td>
                                            {upload ? (
                                                upload?.videoPrivacyStatus === "private" ? (
                                                    "No preview for private video."
                                                ) : (
                                                    <ReactPlayer
                                                        url={`https://youtube.com/watch?v=${upload.videoId}`}
                                                        width="300px"
                                                        height="auto"
                                                    />
                                                )
                                            ) : (
                                                job.message
                                            )}
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    )}
                </ApolloQueryWrapper>
            </VStack>
        </DashboardPage>
    );
}

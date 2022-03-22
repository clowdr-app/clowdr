import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Link, Spinner, Table, Tbody, Td, Th, Thead, Tooltip, Tr, VStack } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import { default as React, useCallback, useMemo } from "react";
import ReactPlayer from "react-player";
import type {
    UploadYouTubeVideos_UploadYouTubeVideoJobFragment,
    UploadYouTubeVideos_YouTubeUploadFragment,
} from "../../../../../generated/graphql";
import {
    Job_Queues_JobStatus_Enum,
    useUploadYouTubeVideos_GetUploadYouTubeVideoJobsQuery,
} from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import QueryWrapper from "../../../../GQL/QueryWrapper";
import usePolling from "../../../../Hooks/usePolling";
import { useTitle } from "../../../../Hooks/useTitle";
import { useConference } from "../../../useConference";
import { DashboardPage } from "../../DashboardPage";

gql`
    query UploadYouTubeVideos_GetUploadYouTubeVideoJobs(
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
    ) {
        job_queues_UploadYouTubeVideoJob(
            where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }
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
        conferenceId
        subconferenceId
        createdAt
    }

    fragment UploadYouTubeVideos_UploadYouTubeVideoJob on job_queues_UploadYouTubeVideoJob {
        id
        conferenceId
        subconferenceId
        createdAt
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
    const { subconferenceId } = useAuthParameters();
    const title = useTitle(`YouTube Uploads from ${conference.shortName}`);
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [existingJobsResult, refetchExistingJobsResult] = useUploadYouTubeVideos_GetUploadYouTubeVideoJobsQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        requestPolicy: "network-only",
        context,
    });
    usePolling(refetchExistingJobsResult, 20000);

    const jobStatus = useCallback((jobStatusName: Job_Queues_JobStatus_Enum) => {
        switch (jobStatusName) {
            case Job_Queues_JobStatus_Enum.Completed:
                return (
                    <Tooltip label="Upload completed">
                        <FAIcon icon="check-circle" iconStyle="s" aria-label="completed" color="green.500" />
                    </Tooltip>
                );
            case Job_Queues_JobStatus_Enum.Expired:
            case Job_Queues_JobStatus_Enum.Failed:
                return (
                    <Tooltip label="Upload failed">
                        <FAIcon icon="exclamation-circle" iconStyle="s" aria-label="error" color="red.500" />
                    </Tooltip>
                );
            case Job_Queues_JobStatus_Enum.InProgress:
            case Job_Queues_JobStatus_Enum.New:
                return <Spinner size="sm" aria-label="in progress" />;
        }
    }, []);

    return (
        <DashboardPage title="Uploads">
            {title}
            <VStack alignItems="stretch" w="100%">
                <QueryWrapper
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
                </QueryWrapper>
            </VStack>
        </DashboardPage>
    );
}

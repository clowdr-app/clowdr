import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Link,
    Spinner,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tooltip,
    Tr,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
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
import { Markdown } from "../../../../Chakra/Markdown";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import QueryWrapper from "../../../../GQL/QueryWrapper";
import usePolling from "../../../../Hooks/usePolling";
import { useConference } from "../../../useConference";
import { DashboardPage } from "../../DashboardPage";

gql`
    query UploadYouTubeVideos_GetUploadYouTubeVideoJobs(
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
    ) {
        job_queues_UploadYouTubeVideoJob(
            where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }
            order_by: [{ createdAt: desc }, { pausedUntil: asc_nulls_last }, { updatedAt: asc }]
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
        pausedUntil
        element {
            id
            name
        }
        youTubeUploads {
            ...UploadYouTubeVideos_YouTubeUpload
        }
    }
`;

function formatJobMessage(
    jobStatusName: Job_Queues_JobStatus_Enum,
    message?: string | null,
    pausedUntil?: string | null
): string {
    if (jobStatusName === Job_Queues_JobStatus_Enum.InProgress) {
        return "Upload in progress. You may close this page while you wait.";
    }

    if (jobStatusName === Job_Queues_JobStatus_Enum.New) {
        if (pausedUntil && Date.parse(pausedUntil) > Date.now())
            return `Upload temporarily paused as your YouTube account is currently rate limited. Next attempt will be at \`${new Date(
                pausedUntil
            ).toLocaleString()}\``;

        return "Upload queued. You may close this page while you wait.";
    }

    if (!message) {
        return "Processing...";
    }

    try {
        const messageObj = JSON.parse(message);
        if (messageObj.errors && messageObj.errors.length) {
            return messageObj.errors.map((x: any) => `\`${x.reason}\`: ${x.message}`).join("\n\n");
        }
    } catch {
        // Ignore
    }

    return message ?? "";
}

export function UploadedPage(): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
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
        requestPolicy: "cache-and-network",
        context,
    });
    usePolling(refetchExistingJobsResult, 20000);

    const jobStatus = useCallback((jobStatusName: Job_Queues_JobStatus_Enum, pausedUntil: Date | null | undefined) => {
        switch (jobStatusName) {
            case Job_Queues_JobStatus_Enum.Completed:
                return (
                    <Tooltip label="Upload completed">
                        <FAIcon icon="check-circle" iconStyle="s" aria-label="completed" color="green.500" />
                    </Tooltip>
                );
            case Job_Queues_JobStatus_Enum.Failed:
                return (
                    <Tooltip label="Upload failed - error">
                        <FAIcon icon="exclamation-circle" iconStyle="s" aria-label="error" color="red.500" />
                    </Tooltip>
                );
            case Job_Queues_JobStatus_Enum.Expired:
                return (
                    <Tooltip label="Upload failed - expired">
                        <FAIcon icon="stopwatch" iconStyle="s" aria-label="failure" color="red.500" />
                    </Tooltip>
                );
            case Job_Queues_JobStatus_Enum.InProgress:
            case Job_Queues_JobStatus_Enum.New:
                if (pausedUntil && pausedUntil.getTime() >= Date.now()) {
                    return (
                        <Tooltip label="Upload temporarily paused as your YouTube account is currently rate limited">
                            <FAIcon icon="pause-circle" iconStyle="s" aria-label="notice" color="yellow.500" />
                        </Tooltip>
                    );
                } else {
                    return <Spinner size="sm" aria-label="in progress" />;
                }
        }
    }, []);

    return (
        <DashboardPage title="Uploads">
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
                                        <Td>
                                            {jobStatus(job.jobStatusName, job.pausedUntil && new Date(job.pausedUntil))}
                                        </Td>
                                        <Td>{upload?.videoPrivacyStatus}</Td>
                                        <Td>
                                            <Markdown>
                                                {upload ? (
                                                    upload?.videoPrivacyStatus === "private" ? (
                                                        "No preview for private video."
                                                    ) : (
                                                        <DeferredVideo
                                                            url={`https://youtube.com/watch?v=${upload.videoId}`}
                                                        />
                                                    )
                                                ) : (
                                                    formatJobMessage(job.jobStatusName, job.message, job.pausedUntil)
                                                )}
                                            </Markdown>
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

function DeferredVideo({ url }: { url: string }): JSX.Element {
    const { isOpen, onOpen } = useDisclosure();
    return isOpen ? (
        <ReactPlayer url={url} width="300px" height="auto" />
    ) : (
        <Box p={2}>
            <Button onClick={onOpen}>Load video</Button>
        </Box>
    );
}

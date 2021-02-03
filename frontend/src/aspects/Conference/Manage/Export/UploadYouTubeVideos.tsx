import { gql } from "@apollo/client";
import {
    Button,
    FormControl,
    FormLabel,
    Heading,
    List,
    ListItem,
    Select,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useToast,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React, { useMemo, useState } from "react";
import {
    UploadYouTubeVideos_UploadYouTubeVideoJobFragment,
    UploadYouTubeVideos_YouTubeUploadFragment,
    useUploadYouTubeVideos_CreateUploadYouTubeVideoJobMutation,
    useUploadYouTubeVideos_GetAttendeeGoogleAccountsQuery,
    useUploadYouTubeVideos_GetContentGroupsQuery,
    useUploadYouTubeVideos_GetUploadYouTubeVideoJobsQuery,
    useUploadYouTubeVideos_GetVideoContentItemsQuery,
    useUploadYouTubeVideos_GetYouTubeUploadsQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useConference } from "../../useConference";
import useCurrentAttendee from "../../useCurrentAttendee";

gql`
    query UploadYouTubeVideos_GetUploadYouTubeVideoJobs($conferenceId: uuid!) {
        job_queues_UploadYouTubeVideoJob(
            where: { conferenceId: { _eq: $conferenceId }, jobStatusName: { _neq: COMPLETED } }
            order_by: { createdAt: desc }
        ) {
            ...UploadYouTubeVideos_UploadYouTubeVideoJob
        }
    }

    fragment UploadYouTubeVideos_UploadYouTubeVideoJob on job_queues_UploadYouTubeVideoJob {
        id
        jobStatusName
        contentItem {
            id
            contentGroup {
                id
                title
            }
            name
        }
    }

    query UploadYouTubeVideos_GetContentGroups($conferenceId: uuid!) {
        ContentGroup(where: { conferenceId: { _eq: $conferenceId } }, order_by: { title: asc }) {
            id
            title
        }
    }

    query UploadYouTubeVideos_GetVideoContentItems($contentGroupId: uuid) {
        ContentItem(
            where: {
                contentGroupId: { _eq: $contentGroupId }
                contentTypeName: { _in: [VIDEO_FILE, VIDEO_BROADCAST, VIDEO_PREPUBLISH] }
            }
            order_by: { name: asc }
        ) {
            id
            name
        }
    }

    query UploadYouTubeVideos_GetAttendeeGoogleAccounts($attendeeId: uuid!) {
        AttendeeGoogleAccount(where: { attendeeId: { _eq: $attendeeId } }) {
            id
            googleAccountEmail
        }
    }

    mutation UploadYouTubeVideos_CreateUploadYouTubeVideoJob(
        $attendeeGoogleAccountId: uuid!
        $conferenceId: uuid!
        $contentItemId: uuid!
    ) {
        insert_job_queues_UploadYouTubeVideoJob_one(
            object: {
                attendeeGoogleAccountId: $attendeeGoogleAccountId
                conferenceId: $conferenceId
                contentItemId: $contentItemId
            }
        ) {
            id
        }
    }

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

export function UploadYouTubeVideos(): JSX.Element {
    const conference = useConference();
    const toast = useToast();
    const attendee = useCurrentAttendee();

    const existingJobsResult = useUploadYouTubeVideos_GetUploadYouTubeVideoJobsQuery({
        variables: {
            conferenceId: conference.id,
        },
        pollInterval: 10000,
    });

    const contentGroupsResult = useUploadYouTubeVideos_GetContentGroupsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const [contentGroupId, setContentGroupId] = useState<string | null>(null);

    const contentGroupOptions = useMemo(() => {
        return contentGroupsResult.data?.ContentGroup.map((contentGroup) => (
            <option key={contentGroup.id} value={contentGroup.id}>
                {contentGroup.title}
            </option>
        ));
    }, [contentGroupsResult.data?.ContentGroup]);

    const contentItemsResult = useUploadYouTubeVideos_GetVideoContentItemsQuery({
        variables: {
            contentGroupId,
        },
    });

    const contentItemOptions = useMemo(() => {
        return contentItemsResult.data?.ContentItem.map((contentItem) => (
            <option key={contentItem.id} value={contentItem.id}>
                {contentItem.name}
            </option>
        ));
    }, [contentItemsResult.data?.ContentItem]);

    const googleAccountsResult = useUploadYouTubeVideos_GetAttendeeGoogleAccountsQuery({
        variables: {
            attendeeId: attendee.id,
        },
    });

    const googleAccountOptions = useMemo(() => {
        return googleAccountsResult.data?.AttendeeGoogleAccount.map((account) => (
            <option key={account.id} value={account.id}>
                {account.googleAccountEmail}
            </option>
        ));
    }, [googleAccountsResult.data?.AttendeeGoogleAccount]);

    const [mutation] = useUploadYouTubeVideos_CreateUploadYouTubeVideoJobMutation();

    const youtubeUploadsResult = useUploadYouTubeVideos_GetYouTubeUploadsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    return (
        <>
            <Heading as="h2" size="md" textAlign="left" mt={4} mb={2}>
                Upload jobs
            </Heading>
            <ApolloQueryWrapper
                queryResult={existingJobsResult}
                getter={(result) => result.job_queues_UploadYouTubeVideoJob}
            >
                {(jobs: readonly UploadYouTubeVideos_UploadYouTubeVideoJobFragment[]) => (
                    <List>
                        {jobs.length > 0 ? (
                            jobs.map((job) => (
                                <ListItem key={job.id}>
                                    {job.id}: {job.contentItem.name} ({job.jobStatusName})
                                </ListItem>
                            ))
                        ) : (
                            <Text>No upload jobs.</Text>
                        )}
                    </List>
                )}
            </ApolloQueryWrapper>
            <Heading as="h2" size="md" textAlign="left" mt={4} mb={2}>
                Upload a video
            </Heading>
            <Formik<{ contentItemId: string | null; attendeeGoogleAccountId: string | null }>
                initialValues={{ contentItemId: null, attendeeGoogleAccountId: null }}
                onSubmit={async (values, actions) => {
                    try {
                        await mutation({
                            variables: {
                                attendeeGoogleAccountId: values.attendeeGoogleAccountId,
                                conferenceId: conference.id,
                                contentItemId: values.contentItemId,
                            },
                        });
                        toast({
                            status: "success",
                            title: "Starting upload to YouTube",
                        });
                        actions.resetForm();
                        await existingJobsResult.refetch();
                    } catch (e) {
                        toast({
                            status: "error",
                            title: "Failed to create YouTube upload job",
                        });
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Field name="contentItemId">
                            {({ field, form }: FieldProps<string>) => (
                                <FormControl
                                    isInvalid={!!form.errors.contentItemId && !!form.touched.attendeeGoogleAccountId}
                                    isRequired
                                >
                                    <FormLabel htmlFor="contentItemId" mt={2}>
                                        Content Item
                                    </FormLabel>
                                    <Select
                                        placeholder="Choose item"
                                        onChange={(event) => setContentGroupId(event.target.value)}
                                    >
                                        {contentGroupOptions}
                                    </Select>
                                    <Select {...field} id="contentItemId" placeholder="Choose file" mt={2}>
                                        {contentItemOptions}
                                    </Select>
                                </FormControl>
                            )}
                        </Field>
                        <Field name="attendeeGoogleAccountId">
                            {({ field, form }: FieldProps<string>) => (
                                <FormControl
                                    isInvalid={
                                        !!form.errors.attendeeGoogleAccountId && !!form.touched.attendeeGoogleAccountId
                                    }
                                    isRequired
                                >
                                    <FormLabel htmlFor="attendeeGoogleAccountId" mt={2}>
                                        Google Account
                                    </FormLabel>
                                    <Select {...field} id="contentItemId" placeholder="Choose Google account" mt={2}>
                                        {googleAccountOptions}
                                    </Select>
                                </FormControl>
                            )}
                        </Field>
                        <Button type="submit" isLoading={isSubmitting} mt={4} colorScheme="green">
                            Upload video to YouTube
                        </Button>
                    </Form>
                )}
            </Formik>

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

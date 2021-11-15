import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Button,
    HStack,
    Table,
    TableCaption,
    Tbody,
    Td,
    Th,
    Thead,
    Tooltip,
    Tr,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { AuthHeaders } from "@midspace/shared-types/auth";
import React, { useMemo } from "react";
import { gql } from "urql";
import { useCreateConferencePrepareJobMutation, useGetConferencePrepareJobsQuery } from "../../../../generated/graphql";
import { makeContext } from "../../../GQL/make-context";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { useConference } from "../../useConference";

gql`
    mutation CreateConferencePrepareJob($conferenceId: uuid!) {
        insert_job_queues_PrepareJob_one(object: { conferenceId: $conferenceId }) {
            id
            conferenceId
        }
    }

    query GetConferencePrepareJobs($conferenceId: uuid!) {
        job_queues_PrepareJob(
            where: { conferenceId: { _eq: $conferenceId } }
            order_by: { createdAt: desc }
            limit: 10
        ) {
            id
            jobStatusName
            message
            updatedAt
            createdAt
            videoRenderJobs {
                id
                jobStatusName
                updated_at
                created_at
            }
        }
    }
`;

export function PrepareJobsList({ conferenceId }: { conferenceId: string }): JSX.Element {
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeaders.Role]: "organizer",
            }),
        []
    );
    const [jobs, getJobs] = useGetConferencePrepareJobsQuery({
        variables: { conferenceId },
        context,
    });
    useQueryErrorToast(jobs.error, false);

    const [createJobResult, createJob] = useCreateConferencePrepareJobMutation();
    useQueryErrorToast(createJobResult.error, false);
    const conference = useConference();
    const toast = useToast();

    return (
        <VStack w="100%" alignItems="left">
            <HStack justifyContent="space-between">
                <Button
                    mt={5}
                    aria-label="Prepare broadcasts"
                    isLoading={createJobResult.fetching}
                    onClick={async () => {
                        try {
                            await createJob(
                                {
                                    conferenceId: conference.id,
                                },
                                {
                                    fetchOptions: {
                                        headers: {
                                            "X-Auth-Role": "main-conference-organizer",
                                        },
                                    },
                                }
                            );
                            getJobs();
                            toast({
                                status: "success",
                                description: "Started preparing broadcasts.",
                            });
                        } catch (err) {
                            console.error("Failed to start preparing broadcasts", err);
                            toast({
                                status: "error",
                                description: "Failed to start preparing broadcasts.",
                            });
                        }
                    }}
                >
                    Prepare broadcasts
                </Button>
                <Button mt={5} aria-label="Refresh job list" onClick={async () => getJobs()}>
                    Refresh
                </Button>
            </HStack>
            {jobs.error ? (
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle mr={2}>Failed to load data</AlertTitle>
                    <AlertDescription>
                        {jobs.error.name}: {jobs.error.message}
                    </AlertDescription>
                </Alert>
            ) : undefined}
            <Table variant="simple" w="100%">
                <TableCaption>Ongoing and past broadcast preparation jobs</TableCaption>
                <Thead>
                    <Tr>
                        <Th>Started at</Th>
                        <Th>Status</Th>
                        <Th>Last updated</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {jobs.data?.job_queues_PrepareJob.map((job) => (
                        <Tr key={job.id}>
                            <Td>{job.createdAt}</Td>
                            <Td>
                                <Tooltip label={job.message}>{job.jobStatusName}</Tooltip>
                            </Td>
                            <Td>{job.updatedAt}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </VStack>
    );
}

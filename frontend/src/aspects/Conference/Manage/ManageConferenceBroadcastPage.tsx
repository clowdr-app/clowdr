import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Container,
    Heading,
    Spinner,
    Table,
    TableCaption,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useToast,
} from "@chakra-ui/react";
import React from "react";
import {
    useConferencePrepareJobSubscriptionSubscription,
    useCreateConferencePrepareJobMutation,
} from "../../../generated/graphql";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { useConference } from "../useConference";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    mutation CreateConferencePrepareJob($conferenceId: uuid!) {
        insert_ConferencePrepareJob_one(object: { conferenceId: $conferenceId }) {
            id
            conferenceId
        }
    }

    subscription ConferencePrepareJobSubscription($conferenceId: uuid!) {
        ConferencePrepareJob(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            jobStatusName
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

function PrepareJobsList({ conferenceId }: { conferenceId: string }): JSX.Element {
    const { data, loading, error } = useConferencePrepareJobSubscriptionSubscription({ variables: { conferenceId } });
    useQueryErrorToast(error);

    return loading ? (
        <Spinner />
    ) : error ? (
        <>Error while loading list of jobs.</>
    ) : (
        <Table variant="simple">
            <TableCaption>Ongoing and past broadcast preparation jobs</TableCaption>
            <Thead>
                <Tr>
                    <Th>Started at</Th>
                    <Th>Status</Th>
                    <Th>Last updated</Th>
                </Tr>
            </Thead>
            <Tbody>
                {data?.ConferencePrepareJob.map((job) => (
                    <Tr key={job.id}>
                        <Td>{job.createdAt}</Td>
                        <Td>{job.jobStatusName}</Td>
                        <Td>{job.updatedAt}</Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
}

export default function ManageConferenceBroadcastPage(): JSX.Element {
    const conference = useConference();
    useDashboardPrimaryMenuButtons();
    const [create, { data, loading, error }] = useCreateConferencePrepareJobMutation();
    useQueryErrorToast(error);
    const toast = useToast();

    return (
        <Container centerContent>
            <Heading as="h1">Broadcast</Heading>
            <Button
                mt={5}
                aria-label="Prepare broadcasts"
                onClick={async () => {
                    await create({
                        variables: {
                            conferenceId: conference.id,
                        },
                    });
                    toast({
                        status: "success",
                        description: "Started preparing broadcasts.",
                    });
                }}
            >
                Prepare broadcasts
            </Button>
            {loading ? <Spinner /> : error ? <Text mt={3}>Failed to start broadcast preparation.</Text> : <></>}
            <Box mt={5}>
                <PrepareJobsList conferenceId={conference.id} />
            </Box>
        </Container>
    );
}

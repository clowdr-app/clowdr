import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Heading,
    Spinner,
    Table,
    TableCaption,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    useToast,
} from "@chakra-ui/react";
import React from "react";
import {
    Permission_Enum,
    useConferencePrepareJobSubscriptionSubscription,
    useCreateConferencePrepareJobMutation,
} from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
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

function PrepareJobsList({ conferenceId }: { conferenceId: string }): JSX.Element {
    const { data, loading, error } = useConferencePrepareJobSubscriptionSubscription({ variables: { conferenceId } });
    useQueryErrorToast(error);

    return loading && !data ? (
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
                        <Td>
                            <Tooltip label={job.message}>{job.jobStatusName}</Tooltip>{" "}
                        </Td>
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
    const [create, { loading, error }] = useCreateConferencePrepareJobMutation();
    useQueryErrorToast(error);
    const toast = useToast();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Broadcasts
            </Heading>
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
        </RequireAtLeastOnePermissionWrapper>
    );
}

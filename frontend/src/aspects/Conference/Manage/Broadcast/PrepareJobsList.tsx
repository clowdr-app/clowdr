import { gql } from "@apollo/client";
import { Spinner, Table, TableCaption, Tbody, Td, Th, Thead, Tooltip, Tr } from "@chakra-ui/react";
import React from "react";
import { useConferencePrepareJobSubscriptionSubscription } from "../../../../generated/graphql";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";

gql`
    mutation CreateConferencePrepareJob($conferenceId: uuid!) {
        insert_ConferencePrepareJob_one(object: { conferenceId: $conferenceId }) {
            id
            conferenceId
        }
    }

    subscription ConferencePrepareJobSubscription($conferenceId: uuid!) {
        ConferencePrepareJob(
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
    const { data, loading, error } = useConferencePrepareJobSubscriptionSubscription({ variables: { conferenceId } });
    useQueryErrorToast(error, false);

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
                            <Tooltip label={job.message}>{job.jobStatusName}</Tooltip>
                        </Td>
                        <Td>{job.updatedAt}</Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
}

import { gql } from "@apollo/client/core";
import { CompleteConferencePrepareJobDocument, FailConferencePrepareJobDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { allVideoRenderJobsEnded } from "./videoRenderJob";

gql`
    mutation FailConferencePrepareJob($id: uuid!, $message: String!) {
        update_ConferencePrepareJob_by_pk(pk_columns: { id: $id }, _set: { jobStatusName: FAILED, message: $message }) {
            id
        }
    }
`;

export async function failConferencePrepareJob(id: string, message: string): Promise<void> {
    // Mark this job as failed
    await apolloClient.mutate({
        mutation: FailConferencePrepareJobDocument,
        variables: {
            id,
            message,
        },
    });
}

gql`
    mutation CompleteConferencePrepareJob($id: uuid!) {
        update_ConferencePrepareJob_by_pk(pk_columns: { id: $id }, _set: { jobStatusName: COMPLETED }) {
            id
        }
    }
`;

export async function finishConferencePrepareJobIfAllRenderJobsEnded(id: string): Promise<void> {
    const renderJobsEnded = await allVideoRenderJobsEnded(id);
    if (renderJobsEnded) {
        await apolloClient.mutate({
            mutation: CompleteConferencePrepareJobDocument,
            variables: {
                id,
            },
        });
    }
}

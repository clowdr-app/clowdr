import { gql } from "@apollo/client/core";
import { FailConferencePrepareJobDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

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

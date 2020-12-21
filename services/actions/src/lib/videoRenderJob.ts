import { gql } from "@apollo/client/core";
import { FailVideoRenderJobDocument, StartVideoRenderJobDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    mutation FailVideoRenderJob($videoRenderJobId: uuid!, $message: String!) {
        update_VideoRenderJob_by_pk(
            pk_columns: { id: $videoRenderJobId }
            _set: { jobStatusName: FAILED, message: $message }
        ) {
            id
            conferencePrepareJobId
        }
    }
`;

export async function failVideoRenderJob(videoRenderJobId: string, message: string): Promise<void> {
    await apolloClient.mutate({
        mutation: FailVideoRenderJobDocument,
        variables: {
            message: message,
            videoRenderJobId,
        },
    });
}

gql`
    mutation StartVideoRenderJob($videoRenderJobId: uuid!, $data: jsonb!) {
        update_VideoRenderJob_by_pk(
            pk_columns: { id: $videoRenderJobId }
            _set: { jobStatusName: IN_PROGRESS }
            _append: { data: $data }
        ) {
            id
        }
    }
`;

export async function startTitlesVideoRenderJob(
    videoRenderJobId: string,
    titleRenderJobData: TitleRenderJobDataBlob,
    openShotExportId: number,
    webhookKey: string
): Promise<void> {
    titleRenderJobData["openShotExportId"] = openShotExportId;
    titleRenderJobData["webhookKey"] = webhookKey;

    await apolloClient.mutate({
        mutation: StartVideoRenderJobDocument,
        variables: {
            data: titleRenderJobData,
            videoRenderJobId,
        },
    });
}

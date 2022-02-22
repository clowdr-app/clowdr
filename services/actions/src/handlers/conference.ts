import { gql } from "@apollo/client/core";
import type { getSlugArgs, updateConferenceLogoArgs, UpdateConferenceLogoResponse } from "@midspace/hasura/action-types";
import { CheckForFrontendHostsDocument, UpdateConferenceLogoDocument } from "../generated/graphql";
import assert from "node:assert";
import { apolloClient } from "../graphqlClient";
import { checkS3Url } from "../lib/aws/s3";

gql`
    query CheckForFrontendHosts($host: jsonb!) {
        system_Configuration(where: { key: { _eq: DEFAULT_FRONTEND_HOST }, value: { _eq: $host } }) {
            key
            value
        }
        conference_Configuration(where: { key: { _eq: FRONTEND_HOST }, value: { _eq: $host } }) {
            key
            value
            conference {
                id
                slug
            }
        }
    }
`;

export async function handleGetSlug(args: getSlugArgs): Promise<string | null> {
    const directSlugMatch = args.url.match(/https:\/\/[^/]*\/conference\/([^/]*)/i);
    if (directSlugMatch?.length === 2) {
        return directSlugMatch[1];
    }

    const originMatch = args.url.match(/(https:\/\/[^/]+).*/i);
    if (originMatch?.length === 2) {
        const origin = originMatch[1];
        const response = await apolloClient.query({
            query: CheckForFrontendHostsDocument,
            variables: {
                host: origin,
            },
        });
        return response.data.system_Configuration[0]?.value
            ? null
            : response.data.conference_Configuration[0]?.conference?.slug ?? null;
    }

    return null;
}

gql`
    mutation updateConferenceLogo(
        $conferenceId: uuid!
        $userId: String!
        $logoMetadata: jsonb = null
    ) {
        update_conference_Conference(
            where: {
                _and: [
                    { id: { _eq: $conferenceId } }
                    { createdBy: { _eq: $userId } }
                ]
            }
            _set: {
                logoS3Data: $logoMetadata
            }
        ) {
            affected_rows
        }
    }
`;

export async function handleUpdateConferenceLogo(
    userId: string,
    { conferenceId, url }: updateConferenceLogoArgs
): Promise<UpdateConferenceLogoResponse> {
    if (!url || url.length === 0) {
        await apolloClient.mutate({
            mutation: UpdateConferenceLogoDocument,
            variables: {
                conferenceId,
                userId,
                logoMetadata: null
            },
        });
    } else {
        const validatedS3URL = await checkS3Url(url);
        if (validatedS3URL.result === "error") {
            throw new Error("Invalid S3 URL");
        }

        assert(process.env.AWS_REGION);
        assert(process.env.AWS_CONTENT_BUCKET_ID);

        await apolloClient.mutate({
            mutation: UpdateConferenceLogoDocument,
            variables: {
                conferenceId,
                userId,
                logoMetadata: {
                    S3Region: process.env.AWS_REGION,
                    S3Bucket: process.env.AWS_CONTENT_BUCKET_ID,
                    S3Key: validatedS3URL.key
                }
            },
        });
    }

    return {
        ok: true
    };
}

import Hasura from "@aaronhayes/hasura-sdk";
import { awsClient } from "../aws/awsClient";

async function createHasuraClient() {
    const GRAPHQL_API_SECURE_PROTOCOLS = await awsClient.getAWSParameter("GRAPHQL_API_SECURE_PROTOCOLS");
    const GRAPHQL_API_DOMAIN = await awsClient.getAWSParameter("GRAPHQL_API_DOMAIN");
    const HASURA_ADMIN_SECRET = await awsClient.getSecret("HASURA_ADMIN_SECRET");

    return new Hasura({
        endpoint: `${GRAPHQL_API_SECURE_PROTOCOLS !== "false" ? "https" : "http"}://${GRAPHQL_API_DOMAIN}`,
        adminSecret: HASURA_ADMIN_SECRET,
    });
}

export const hasura = createHasuraClient();

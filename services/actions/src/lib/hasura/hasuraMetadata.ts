import Hasura from "@aaronhayes/hasura-sdk";
import assert from "assert";

assert(process.env.GRAPHQL_API_DOMAIN, "GRAPHQL_API_DOMAIN environment variable must be specified");
assert(process.env.GRAPHQL_API_SECURE_PROTOCOLS, "GRAPHQL_API_SECURE_PROTOCOLS environment variable must be specified");
assert(process.env.EVENT_SECRET, "EVENT_SECRET environment variable must be specified");

const hasura = new Hasura({
    endpoint: `${process.env.GRAPHQL_API_SECURE_PROTOCOLS !== "false" ? "https" : "http"}://${
        process.env.GRAPHQL_API_DOMAIN
    }`,
    adminSecret: process.env.EVENT_SECRET,
});

export { hasura };

import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import { expect, test } from "vitest";
import type { BasicQuery, BasicQueryVariables } from "../src/generated/graphql";
import { BasicDocument } from "../src/generated/graphql";

gql`
    query Basic {
        User {
            id
        }
    }
`;

test("Can execute basic GQL query", async () => {
    expect(gqlClient).toBeTruthy();
    const response = await gqlClient?.query<BasicQuery, BasicQueryVariables>(BasicDocument).toPromise();
    expect(response?.error).toBeUndefined();
    expect(response?.data?.User).toBeDefined();
});

test("Test user exists", async () => {
    const response = await gqlClient?.query<BasicQuery, BasicQueryVariables>(BasicDocument).toPromise();
    expect(response?.error).toBeUndefined();
    expect(response?.data?.User.length).toBeGreaterThan(0);
    expect(response?.data?.User.find((x) => x.id === process.env.TEST_USER_ID)).toBeDefined();
});

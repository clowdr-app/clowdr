import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import { assert, expect, test } from "vitest";
import type { BasicQuery, BasicQueryVariables } from "../src/generated/graphql";
import { BasicDocument } from "../src/generated/graphql";

// Edit an assertion and save to see HMR in action

gql`
    query Basic {
        User {
            id
        }
    }
`;

test("Math.sqrt()", () => {
    expect(Math.sqrt(4)).toBe(2);
    expect(Math.sqrt(144)).toBe(12);
    expect(Math.sqrt(2)).toBe(Math.SQRT2);
});

test("JSON", () => {
    const input = {
        foo: "hello",
        bar: "world",
    };

    const output = JSON.stringify(input);

    expect(output).eq('{"foo":"hello","bar":"world"}');
    assert.deepEqual(JSON.parse(output), input, "matches original");
});

test("Can execute basic GQL query", async () => {
    expect(gqlClient).toBeTruthy();
    const response = await gqlClient?.query<BasicQuery, BasicQueryVariables>(BasicDocument).toPromise();
    expect(response?.error).toBeFalsy();
});

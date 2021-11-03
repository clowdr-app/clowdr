/* eslint-disable @typescript-eslint/no-var-requires */
const schema = require.resolve("@midspace/graphql/schema.graphql");

/** @type import("@graphql-codegen/plugin-helpers/types").Types.Config */
module.exports = {
    schema: [schema],
    hooks: {
        afterAllFileWrite: "prettier --write",
    },
    documents: ["./src/**/*.ts", "!./src/**/*.d.ts"],
    overwrite: true,
    generates: {
        "./src/generated/graphql.ts": {
            plugins: ["typescript", "typescript-operations", "typed-document-node"],
            config: {
                skipTypename: false,
                withHooks: false,
                withHOC: false,
                withComponent: false,
            },
        },
    },
};

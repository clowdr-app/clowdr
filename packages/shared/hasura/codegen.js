/* eslint-disable @typescript-eslint/no-var-requires */
const schema = require.resolve("@midspace/graphql/schema.graphql");

/** @type import("@graphql-codegen/plugin-helpers/types").Types.Config */
module.exports = {
    schema: [schema],
    hooks: {
        afterAllFileWrite: "prettier --write",
    },
    documents: [],
    overwrite: true,
    generates: {
        "./src/generated/graphql.ts": {
            plugins: ["typescript"],
            config: {
                useTypeImports: true,
            },
        },
        "./src/generated/graphql.schema.json": {
            plugins: ["introspection"],
            config: {
                minify: true,
            },
        },
    },
};

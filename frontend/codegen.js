/* eslint-disable @typescript-eslint/no-var-requires */
const schema = require.resolve("@midspace/graphql/schema.graphql");

module.exports = {
    schema: [schema],
    hooks: {
        afterAllFileWrite: "prettier --write",
    },
    documents: [
        "./src/aspects/**/*.tsx",
        "./src/aspects/**/*.ts",
        "./src/types/**/*.tsx",
        "./src/types/**/*.ts",
        "./src/*.tsx",
        "./src/*.ts",
    ],
    overwrite: true,
    generates: {
        "./src/generated/graphql.tsx": {
            plugins: ["typescript", "typescript-operations", "typescript-urql", "typescript-urql-graphcache"],
            config: {
                skipTypename: false,
                withHooks: true,
                withHOC: false,
                withComponent: false,
                useTypeImports: true,
                immutableTypes: true,
                withResultType: true,
                preResolveTypes: true,
                addDocBlocks: true,
            },
        },
        "./src/generated/graphql.schema.json": {
            plugins: ["urql-introspection"],
            config: {
                minify: false,
            },
        },
    },
};

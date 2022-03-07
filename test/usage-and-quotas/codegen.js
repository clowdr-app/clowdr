/* eslint-disable @typescript-eslint/no-var-requires */
const schema = require.resolve("@midspace/graphql/schema.graphql");

module.exports = {
    schema: [schema],
    hooks: {
        afterAllFileWrite: "prettier --write",
    },
    documents: ["./src/*.tsx", "./src/*.ts", "./test/**/*.tsx", "./test/**/*.ts"],
    overwrite: true,
    generates: {
        "./src/generated/graphql.ts": {
            plugins: ["typescript", "typescript-operations", "typescript-urql"],
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
    },
};

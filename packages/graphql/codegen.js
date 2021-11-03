require("dotenv/config");

/** @type import("@graphql-codegen/plugin-helpers/types").Types.Config */
module.exports = {
    schema: [
        {
            [`http${process.env.GRAPHQL_API_SECURE_PROTOCOLS !== "false" ? "s" : ""}://${
                process.env.GRAPHQL_API_DOMAIN
            }/v1/graphql`]: {
                headers: {
                    "X-Hasura-Admin-Secret": process.env.HASURA_ADMIN_SECRET,
                },
            },
        },
    ],
    hooks: {
        afterAllFileWrite: "prettier --write",
    },
    documents: [],
    overwrite: true,
    generates: {
        "./src/graphql.ts": {
            plugins: ["typescript"],
            config: {
                useTypeImports: true,
            },
        },
        "./generated/schema.graphql": {
            plugins: ["schema-ast"],
            config: {
                includeDirectives: true,
            },
        },
        "./generated/graphql.schema.json": {
            plugins: ["introspection"],
            config: {
                includeDirectives: true,
            },
        },
    },
};

require("dotenv").config();

module.exports = {
    schema: [
        {
            "http://localhost:8080/v1/graphql": {
                headers: {
                    "X-Hasura-Admin-Secret": process.env.HASURA_ADMIN_SECRET,
                },
            },
        },
    ],
    documents: ["./src/**/*.ts", "!./src/**/*.d.ts"],
    overwrite: true,
    generates: {
        "./src/generated/graphql.ts": {
            plugins: [
                "typescript",
                "typescript-operations",
                "typed-document-node",
            ],
            config: {
                skipTypename: false,
                withHooks: false,
                withHOC: false,
                withComponent: false,
            },
        },
        "./graphql.schema.json": {
            plugins: ["introspection"],
        },
    },
};

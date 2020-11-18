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
    documents: ["./src/**/*.tsx", "./src/**/*.ts"],
    overwrite: true,
    generates: {
        "./src/generated/graphql.tsx": {
            plugins: [
                "typescript",
                "typescript-operations",
                "typescript-react-apollo",
            ],
            config: {
                skipTypename: false,
                withHooks: true,
                withHOC: false,
                withComponent: false,
            },
        },
        "./graphql.schema.json": {
            plugins: ["introspection"],
        },
    },
};

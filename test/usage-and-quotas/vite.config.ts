import { defineConfig } from "vite";
import EnvironmentPlugin from "vite-plugin-environment";

export default defineConfig({
    plugins: [
        EnvironmentPlugin([
            "HASURA_ADMIN_SECRET",
            "GRAPHQL_API_SECURE_PROTOCOLS",
            "GRAPHQL_API_DOMAIN",
            "TEST_USER_ID",
        ]),
    ],
});

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    mount: {
        public: "/",
        src: "/_dist_",
        "../shared": "/@clowdr-app/shared-types",
    },
    plugins: [
        "@snowpack/plugin-react-refresh",
        "@snowpack/plugin-dotenv",
        "@snowpack/plugin-typescript",
        "@snowpack/plugin-webpack",
    ],
    install: [
        /* ... */
    ],
    installOptions: {
        /* ... */
    },
    devOptions: {
        port: 3000,
    },
    buildOptions: {
        /* ... */
    },
    proxy: {
        /* ... */
    },
    alias: {
        "@clowdr-app/shared-types": "../shared",
    },
};

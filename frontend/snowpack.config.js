/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    mount: {
        public: "/",
        src: "/_dist_",
    },
    plugins: [
        "@snowpack/plugin-react-refresh",
        "@snowpack/plugin-dotenv",
        ["./snowpack/plugins/plugin-typescript/plugin.js", { tsc: "ttsc" }],
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
};

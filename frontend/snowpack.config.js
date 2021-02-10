/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
    mount: {
        public: "/",
        src: "/_dist_",
    },
    plugins: [
        "@snowpack/plugin-react-refresh",
        "@snowpack/plugin-dotenv",
        "@snowpack/plugin-typescript",
        "@snowpack/plugin-webpack",
    ],
    devOptions: {
        port: 3000,
    },
    buildOptions: {
        /* ... */
    },
};

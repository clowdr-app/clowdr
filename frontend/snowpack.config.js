/** @type {import("snowpack").SnowpackUserConfig } */

module.exports = {
    mount: {
        public: "/",
        src: "/_dist_",
    },
    packageOptions: {
        polyfillNode: true,
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
    routes: [{ match: "routes", src: ".*", dest: "/index.html" }],
};
